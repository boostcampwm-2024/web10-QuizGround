import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [GameModule, ChatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
