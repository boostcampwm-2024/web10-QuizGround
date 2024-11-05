import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true, //dto를 수정 가능하게(dto 기본값 들어가도록)
  //     transformOptions: {
  //       enableImplicitConversion: true //Class-Validator Type에 맞게 자동형변환
  //     },
  //     whitelist: true,
  //     forbidNonWhitelisted: true
  //   })
  // );

  await app.listen(3000);
  Logger.log('Application running on port 3000');
}
bootstrap();
