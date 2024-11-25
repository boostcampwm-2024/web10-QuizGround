import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GameValidator } from '../validations/game.validator';
import { CreateGameDto } from '../dto/create-game.dto';
import { REDIS_KEY } from '../../common/constants/redis-key.constant';
import { generateUniquePin } from '../../common/utils/utils';
import SocketEvents from '../../common/constants/socket-events';
import { UpdateRoomOptionDto } from '../dto/update-room-option.dto';
import { UpdateRoomQuizsetDto } from '../dto/update-room-quizset.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Socket } from 'socket.io';

@Injectable()
export class GameRoomService {
  private readonly logger = new Logger(GameRoomService.name);
  private readonly INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30분 30 * 60 * 1000;
  private readonly PLAYER_GRACE_PERIOD = 10; // 10초

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly gameValidator: GameValidator
  ) {}

  async createRoom(gameConfig: CreateGameDto, clientId: string): Promise<string> {
    const currentRoomPins = await this.redis.smembers(REDIS_KEY.ACTIVE_ROOMS);
    const roomId = generateUniquePin(currentRoomPins);

    await this.redis.hmset(REDIS_KEY.ROOM(roomId), {
      host: clientId,
      status: 'waiting',
      title: gameConfig.title,
      gameMode: gameConfig.gameMode,
      maxPlayerCount: gameConfig.maxPlayerCount.toString(),
      isPublic: gameConfig.isPublic ? '1' : '0',
      isWaiting: '1',
      lastActivityAt: new Date().getTime().toString(),
      quizSetId: '-1', // 미설정시 기본퀴즈를 진행, -1은 기본 퀴즈셋
      quizCount: '2',
      quizSetTitle: '기본 퀴즈셋'
    });

    await this.redis.sadd(REDIS_KEY.ACTIVE_ROOMS, roomId);
    this.logger.verbose(`게임 방 생성 완료: ${roomId}`);

    return roomId;
  }

  async joinRoom(client: Socket, gameId: string, clientId: string) {
    const roomKey = REDIS_KEY.ROOM(gameId);
    const room = await this.redis.hgetall(roomKey);
    this.gameValidator.validateRoomExists(SocketEvents.JOIN_ROOM, room);

    const currentPlayers = await this.redis.smembers(REDIS_KEY.ROOM_PLAYERS(gameId));
    if (room.status !== 'waiting' || room.isWaiting != '1') {
      // 게임 진행 중
      // 재접속 여부 체크 후 처리
      if (!(await this.redis.exists(REDIS_KEY.PLAYER(clientId)))) {
        this.gameValidator.validateRoomProgress(
          SocketEvents.JOIN_ROOM,
          room.status,
          room.isWaiting
        );
      }
      const playerData = await this.redis.hgetall(REDIS_KEY.PLAYER(clientId));
      if (playerData.gameId !== gameId) {
        this.gameValidator.validateRoomProgress(
          SocketEvents.JOIN_ROOM,
          room.status,
          room.isWaiting
        );
      }
      // 재접속 처리
      const players = [];
      for (const playerId of currentPlayers) {
        const player = await this.redis.hgetall(REDIS_KEY.PLAYER(playerId));
        players.push({
          playerId,
          playerName: player.playerName,
          playerPosition: [parseFloat(player.positionX), parseFloat(player.positionY)]
        });
      }
      client.emit(SocketEvents.JOIN_ROOM, { players });
      return;
    }

    this.gameValidator.validateRoomCapacity(
      SocketEvents.JOIN_ROOM,
      currentPlayers.length,
      parseInt(room.maxPlayerCount)
    );

    client.join(gameId); //validation 후에 조인해야함

    const playerKey = REDIS_KEY.PLAYER(clientId);
    const positionX = Math.random();
    const positionY = Math.random();

    await this.redis.set(`${playerKey}:Changes`, 'Join');
    await this.redis.hmset(playerKey, {
      playerName: '닉네임 설정 이전',
      positionX: positionX.toString(),
      positionY: positionY.toString(),
      disconnected: '0',
      gameId: gameId
    });

    await this.redis.zadd(REDIS_KEY.ROOM_LEADERBOARD(gameId), 0, clientId);
    await this.redis.sadd(REDIS_KEY.ROOM_PLAYERS(gameId), clientId);

    const players = [];
    for (const playerId of currentPlayers) {
      const player = await this.redis.hgetall(REDIS_KEY.PLAYER(playerId));
      players.push({
        playerId,
        playerName: player.playerName,
        playerPosition: [parseFloat(player.positionX), parseFloat(player.positionY)]
      });
    }

    const roomData = await this.redis.hgetall(REDIS_KEY.ROOM(gameId));
    client.emit(SocketEvents.UPDATE_ROOM_OPTION, {
      title: roomData.title,
      gameMode: roomData.gameMode,
      maxPlayerCount: parseInt(roomData.maxPlayerCount),
      isPublic: roomData.isPublic === '1'
    });

    this.logger.verbose(`게임 방 입장 완료: ${gameId} - ${clientId}`);
    client.emit(SocketEvents.JOIN_ROOM, { players });
  }

  async updateRoomOption(updateRoomOptionDto: UpdateRoomOptionDto, clientId: string) {
    const { gameId, gameMode, title, maxPlayerCount, isPublic } = updateRoomOptionDto;
    const roomKey = `Room:${gameId}`;

    const room = await this.redis.hgetall(roomKey);
    this.gameValidator.validateRoomExists(SocketEvents.UPDATE_ROOM_OPTION, room);

    this.gameValidator.validatePlayerIsHost(SocketEvents.UPDATE_ROOM_OPTION, room, clientId);

    await this.redis.set(`${roomKey}:Changes`, 'Option');
    await this.redis.hmset(roomKey, {
      title: title,
      gameMode: gameMode,
      maxPlayerCount: maxPlayerCount.toString(),
      isPublic: isPublic ? '1' : '0'
    });
    this.logger.verbose(`게임방 옵션 변경: ${gameId}`);
  }

  async updateRoomQuizset(updateRoomQuizsetDto: UpdateRoomQuizsetDto, clientId: string) {
    const { gameId, quizSetId, quizCount } = updateRoomQuizsetDto;
    const roomKey = `Room:${gameId}`;

    const room = await this.redis.hgetall(roomKey);
    this.gameValidator.validateRoomExists(SocketEvents.UPDATE_ROOM_QUIZSET, room);

    this.gameValidator.validatePlayerIsHost(SocketEvents.UPDATE_ROOM_QUIZSET, room, clientId);

    await this.redis.set(`${roomKey}:Changes`, 'Quizset');
    await this.redis.hmset(roomKey, {
      quizSetId: quizSetId.toString(),
      quizCount: quizCount.toString()
    });
    this.logger.verbose(`게임방 퀴즈셋 변경: ${gameId}`);
  }

  /**
   * 플레이어 퇴장 처리
   */
  async handlePlayerExit(clientId: string): Promise<void> {
    const playerKey = REDIS_KEY.PLAYER(clientId);
    const player = await this.redis.hgetall(playerKey);
    const roomId = player.gameId;

    const pipeline = this.redis.pipeline();

    // 플레이어 제거
    pipeline.srem(REDIS_KEY.ROOM_PLAYERS(roomId), clientId);
    // pipeline.del(REDIS_KEY.PLAYER(clientId));
    // 1. 플레이어 상태를 'disconnected'로 변경하고 TTL 설정
    pipeline.hmset(REDIS_KEY.PLAYER(clientId), {
      disconnected: '1',
      disconnectedAt: Date.now().toString()
    });
    pipeline.expire(REDIS_KEY.PLAYER(clientId), this.PLAYER_GRACE_PERIOD);

    // 남은 플레이어 수 확인
    pipeline.scard(REDIS_KEY.ROOM_PLAYERS(roomId));

    const results = await pipeline.exec();
    const remainingPlayers = results[3][1] as number;

    // 4. 플레이어 관련 모든 키에 TTL 설정
    await this.setTTLForPlayerKeys(clientId);

    if (remainingPlayers === 0) {
      // 마지막 플레이어가 나간 경우
      await this.redis.publish('room:cleanup', roomId);
      this.logger.log(`마지막 플레이어 퇴장으로 방 ${roomId} 정리 시작`);
    }
  }

  /**
   * 방 활동 업데이트
   */
  async updateRoomActivity(roomId: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    pipeline.set(`${REDIS_KEY.ROOM(roomId)}:Changes`, 'lastActivityAt');
    pipeline.hset(REDIS_KEY.ROOM(roomId), 'lastActivityAt', Date.now().toString());
    pipeline.hget(REDIS_KEY.ROOM(roomId), 'lastActivityAt');

    await pipeline.exec();
  }

  /**
   * 비활성 방 체크 (주기적으로 실행)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkInactiveRooms(): Promise<void> {
    const now = Date.now();
    const rooms = await this.redis.smembers(REDIS_KEY.ACTIVE_ROOMS);
    this.logger.verbose(`비활성 방 체크시작 / 활성 방 목록: ${rooms}`);

    for (const roomId of rooms) {
      const lastActivity = await this.redis.hget(REDIS_KEY.ROOM(roomId), 'lastActivityAt');

      if (lastActivity && now - parseInt(lastActivity) > this.INACTIVE_THRESHOLD) {
        await this.redis.publish('room:cleanup', roomId);
        this.logger.verbose(`비활성으로 인해 방 ${roomId} 정리 시작`);
      }
    }
  }

  /**
   * 플레이어 관련 모든 데이터에 TTL 설정
   */
  private async setTTLForPlayerKeys(clientId: string): Promise<void> {
    let cursor = '0';
    const pattern = `Player:${clientId}:*`;
    const pipeline = this.redis.pipeline();

    do {
      // SCAN으로 플레이어 관련 키들을 배치로 찾기
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      // 찾은 모든 키에 TTL 설정
      for (const key of keys) {
        pipeline.expire(key, this.PLAYER_GRACE_PERIOD);
      }
    } while (cursor !== '0');

    await pipeline.exec();
  }
}
