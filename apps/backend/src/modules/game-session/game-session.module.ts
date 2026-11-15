import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './game-session.entity.ts';
import { GameSessionPlayer } from './game-session-player.entity.ts';
import { GameSessionService } from './game-session.service.ts';

@Module({
  imports: [TypeOrmModule.forFeature([GameSession, GameSessionPlayer])],
  providers: [GameSessionService],
  exports: [GameSessionService],
})
export class GameSessionModule {}
