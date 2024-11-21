// 활동 시간 업데이트는 비즈니스 로직과 분리
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { of } from 'rxjs';
import { GameRoomService } from '../service/game.room.service';

@Injectable()
export class GameActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GameActivityInterceptor.name);

  constructor(private readonly gameRoomService: GameRoomService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    // 핵심 로직 실행 전
    const before = Date.now();

    // 핵심 로직 실행
    const result = await next.handle().toPromise();

    // 활동 시간 업데이트 (부가 기능)
    const data = context.switchToWs().getData();
    if (data.gameId) {
      await this.gameRoomService.updateRoomActivity(data.gameId);
      this.logger.debug(`방 ${data.gameId} 활동시간 갱신 완료 / after ${Date.now() - before}ms`);
    }

    return of(result);
  }
}
