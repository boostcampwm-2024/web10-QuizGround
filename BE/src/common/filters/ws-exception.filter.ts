import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private logger = new Logger('WsExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    // ValidationPipe에서 발생한 에러 처리
    if (exception.response) {
      this.logger.error(`Validation Error: ${JSON.stringify(exception.response)}`);

      // TODO: API 명세서 확인
      client.emit('exception', {
        status: 'error',
        message: exception.response.message || 'Validation failed',
      });
      return;
    }

    this.logger.error(`WebSocket Error: ${exception.message}`, exception.stack);

    // 일반적인 WS 예외 처리
    // TODO: API 명세서 확인
    client.emit('exception', {
      status: 'error',
      message: exception.message || 'Internal server error',
    });
  }
}