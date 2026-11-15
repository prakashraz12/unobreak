import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.ts';
import { MatchModule } from '../match/match.module.ts';
import { GameSessionModule } from '../game-session/game-session.module.ts';
import { UserModule } from '../user/user.module.ts';
import { LobbyGateway } from './lobby.gateway.ts';
import { GameGateway } from './game.gateway.ts';
import { GameRuntimeService } from './game-runtime.service.ts';
import { RealtimeService } from './realtime.service.ts';

@Module({
  imports: [AuthModule, MatchModule, GameSessionModule, UserModule],
  providers: [LobbyGateway, GameGateway, GameRuntimeService, RealtimeService],
  exports: [RealtimeService],
})
export class RoomModule {}
