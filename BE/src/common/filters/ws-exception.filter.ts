import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    // ValidationPipe에서 발생한 에러 처리
    if (exception.response) {
      client.emit('exception', {
        status: 'error',
        message: exception.response.message || 'Validation failed',
      });
      return;
    }

    // 일반적인 WS 예외 처리
    client.emit('exception', {
      status: 'error',
      message: exception.message || 'Internal server error',
    });
  }
}