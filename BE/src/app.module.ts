import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { QuizSetModel } from './quiz/entities/quiz-set.entity';
import { QuizModel } from './quiz/entities/quiz.entity';
import { QuizChoiceModel } from './quiz/entities/quiz-choice.entity';
import { UserModel } from './user/entities/user.entity';
import { UserQuizArchiveModel } from './user/entities/user-quiz-archive.entity';
import { InitDBModule } from './InitDB/InitDB.module';
import { UserModule } from './user/user.module';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true
    }),
    GameModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: +process.env.DB_PORT || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWD || 'test',
      database: process.env.DB_NAME || 'test_db',
      entities: [QuizSetModel, QuizModel, QuizChoiceModel, UserModel, UserQuizArchiveModel],
      synchronize: process.env.DEV ? true : false, // 개발 모드에서만 활성화
      logging: true, // 모든 쿼리 로깅
      logger: 'advanced-console'
      // extra: {
      //   // 글로벌 batch size 설정
      //   maxBatchSize: 100
      // }
    }),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    }),
    QuizModule,
    UserModule,
    InitDBModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
