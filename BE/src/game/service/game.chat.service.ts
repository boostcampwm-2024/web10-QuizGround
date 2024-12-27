import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { GameValidator } from '../validations/game.validator';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { REDIS_KEY } from '../../common/constants/redis-key.constant';
import SocketEvents from '../../common/constants/socket-events';
import { Namespace } from 'socket.io';
import { TraceClass } from '../../common/interceptor/SocketEventLoggerInterceptor';
import { SurvivalStatus } from '../../common/constants/game';
import { MetricService } from '../../metric/metric.service';
import { BatchProcessorType, createBatchProcessor } from './BatchProcessor';

@TraceClass()
@Injectable()
export class GameChatService {
  private readonly logger = new Logger(GameChatService.name);
  private chatProcessor: ReturnType<typeof createBatchProcessor>;
  private chatProcessorDead: ReturnType<typeof createBatchProcessor>;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly gameValidator: GameValidator,
    private metricService: MetricService
  ) {}

  async chatMessage(chatMessage: ChatMessageDto, clientId: string) {
    const { gameId, message } = chatMessage;
    const roomKey = REDIS_KEY.ROOM(gameId);

    const room = await this.redis.hgetall(roomKey);
    this.gameValidator.validateRoomExists(SocketEvents.CHAT_MESSAGE, room);

    const playerKey = REDIS_KEY.PLAYER(clientId);
    const player = await this.redis.hgetall(playerKey);

    this.gameValidator.validatePlayerInRoom(SocketEvents.CHAT_MESSAGE, gameId, player);

    await this.redis.publish(
      `chat:${gameId}`,
      JSON.stringify({
        playerId: clientId,
        playerName: player.playerName,
        message,
        timestamp: new Date()
      })
    );

    this.logger.verbose(
      `[chatMessage] Room: ${gameId} | playerId: ${clientId} | playerName: ${player.playerName} | isAlive: ${player.isAlive ? '생존자' : '관전자'} | Message: ${message}`
    );
  }

  async subscribeChatEvent(server: Namespace) {
    this.chatProcessor = createBatchProcessor(
      server,
      SocketEvents.CHAT_MESSAGE,
      BatchProcessorType.DEFAULT,
      this.redis
    );
    this.chatProcessor.startProcessing(50); // 채팅은 더 빠른 업데이트가 필요할 수 있어서 50ms

    this.chatProcessorDead = createBatchProcessor(
      server,
      SocketEvents.CHAT_MESSAGE,
      BatchProcessorType.ONLY_DEAD,
      this.redis
    );
    this.chatProcessorDead.startProcessing(50);

    const chatSubscriber = this.redis.duplicate();
    chatSubscriber.psubscribe('chat:*');

    chatSubscriber.on('pmessage', async (_pattern, channel, message) => {
      const startedAt = process.hrtime();

      const gameId = channel.split(':')[1]; // ex. channel: chat:317172
      const chatMessage = JSON.parse(message);

      const playerKey = REDIS_KEY.PLAYER(chatMessage.playerId);
      const isAlivePlayer = await this.redis.hget(playerKey, 'isAlive');

      // 생존한 사람이라면 전체 브로드캐스팅
      if (isAlivePlayer === SurvivalStatus.ALIVE) {
        this.chatProcessor.pushData(gameId, chatMessage);
      } else {
        this.chatProcessorDead.pushData(gameId, chatMessage);
      }

      const endedAt = process.hrtime(startedAt);
      const delta = endedAt[0] * 1e9 + endedAt[1];
      const executionTime = delta / 1e6;

      this.metricService.recordResponse('Chat', 'success');
      await this.metricService.recordLatency('Chat', 'response', executionTime);
    });
  }
}
