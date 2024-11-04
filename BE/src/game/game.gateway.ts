import { SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { CreateGameDto } from './dto/create-game.dto';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';

export type GameConfig = {
  title: string;
  gameMode: string; // TODO: enum으로 변경
  maxPlayerCount: number;
  isPublicGame: boolean;
};

type GameRoom = {
  id: string;
  players: Map<string, player>;
  config: GameConfig;
  createdAt: Date;
  status: 'waiting' | 'playing' | 'finished';
}

type player = {
  nickname: string;
  score: number;
  isHost: boolean;
  joinedAt: Date;
}

@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe({
  transform: true,
  exceptionFactory: (errors) => {
    return new WsException({
      status: 'error',
      message: Object.values(errors[0].constraints)[0]
    });
  }
}))
@WebSocketGateway({
  cors: {
    origin: '*', // TODO: 실제 서비스에서는 특정 도메인만 허용해야 함
  },
  namespace: '/game', // TODO: 추후 논의하여 변경
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, GameRoom> = new Map();

  @SubscribeMessage('createGame') // TODO: 이벤트 타입 enum 따로 정의해서 사용하기
  handleCreateRoom(client: Socket, gameConfig: CreateGameDto): void {
    const roomId = uuidv4();
    const newGame: GameRoom = {
      id: roomId,
      players: new Map([[client.id, {
        nickname: 'host',
        score: 0,
        isHost: true,
        joinedAt: new Date()
      }]]),
      config: gameConfig,
      createdAt: new Date(),
      status: 'waiting'
    };

    client.join(roomId);
    this.rooms.set(roomId, newGame);

    client.emit('createGame', {
      roomId,
      status: 'success'
    });
  }

  // TODO: 게임 방 입장 시
  @SubscribeMessage('joinGame') // TODO: 이벤트 타입 enum 따로 정의해서 사용하기
  handleJoinRoom(client: Socket, roomId: string): void { // TODO: roomId 뿐만 아니라 게스트의 닉네임도 받아야 함
    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('error', '[ERROR] 존재하지 않는 게임 방입니다.');
      return;
    }
    if (room.players.size >= room.config.maxPlayerCount) {
      client.emit('error', '[ERROR] 게임 방 최대 인원이 모두 찼습니다.');
      return;
    }

    client.join(roomId);
    const newPlayer: player = {
      nickname: '', // TODO: 게스트의 닉네임 받아서 저장하기
      score: 0,
      isHost: false,
      joinedAt: new Date()
    };
    room.players.set(client.id, newPlayer);
  }

  // TODO: 일정 시간 동안 게임 방이 사용되지 않으면 방 정리 (@Cron으로 구현)

  afterInit() {
    console.log('WebSocket 서버 초기화 완료했어요!'); // TODO: console보다는 로거 사용
  }

  handleConnection(client: Socket) {
    console.log(`클라이언트가 연결되었어요!: ${client.id}`); // TODO: console보다는 로거 사용
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트가 연결 해제되었어요!: ${client.id}`); // TODO: console보다는 로거 사용
    this.rooms.forEach((room, roomId) => {
      room.players.delete(client.id);
      if (room.players.size === 0) {
        this.rooms.delete(roomId); // TODO: delete는 성능이 좋지 않음. 우선 임시로 사용하고 향후 Redis로 개선
      }
    });
  }
}