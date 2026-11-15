import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { GameAction } from '@repo/game-engine';
import { GameSessionStatus } from '../../common/constant.ts';
import { AuthService } from '../auth/auth.service.ts';
import { GameSession } from '../game-session/game-session.entity.ts';
import { GameSessionService } from '../game-session/game-session.service.ts';
import { GameRuntimeService } from './game-runtime.service.ts';
import {
  authenticateSocket,
  gameRoom,
  type AuthedSocket,
} from './socket-helpers.ts';

/**
 * Live game traffic: per-player views, actions, restarts, and leaves.
 * Bots, broadcasting, and turn timers live in GameRuntimeService; presence
 * and match tickets live in LobbyGateway.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? true,
    credentials: true,
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: GameSessionService,
    private readonly gameRuntime: GameRuntimeService,
  ) {}

  afterInit(server: Server) {
    // Both gateways share the namespace — the runtime emits through this ref.
    this.gameRuntime.server = server;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      await authenticateSocket(client, this.authService);
    } catch {
      client.disconnect();
    }
  }

  private async requireSessionPlayer(
    client: AuthedSocket,
    sessionId: number,
  ): Promise<GameSession> {
    const session = await this.sessionService.findById(sessionId);
    if (
      !session ||
      !this.sessionService.isPlayer(session, client.data.user.sub)
    ) {
      throw new WsException(`Game session ${sessionId} not found`);
    }
    return session;
  }

  /** Subscribe to a session and get your current view back. */
  @SubscribeMessage('game:state')
  async gameState(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('sessionId') sessionId: number,
  ) {
    const session = await this.requireSessionPlayer(client, sessionId);
    await client.join(gameRoom(sessionId));
    return this.sessionService.payloadFor(
      session,
      client.data.user.sub,
      [],
      this.gameRuntime.autoPlayedIn(sessionId),
    );
  }

  /** Take your seat back from the bot after an idle takeover. */
  @SubscribeMessage('game:resume')
  async gameResume(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('sessionId') sessionId: number,
  ) {
    await this.requireSessionPlayer(client, sessionId);
    await this.gameRuntime.resumeControl(
      sessionId,
      String(client.data.user.sub),
    );
    return { ok: true };
  }

  @SubscribeMessage('game:chat')
  async gameChat(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('sessionId') sessionId: number,
    @MessageBody('text') text: unknown,
  ) {
    if (typeof text !== 'string' || !text.trim() || text.length > 40) {
      throw new WsException('Invalid chat message');
    }
    await this.requireSessionPlayer(client, sessionId);
    client.to(gameRoom(sessionId)).emit('game:chat', {
      playerId: String(client.data.user.sub),
      text: text.trim(),
    });
    return { ok: true };
  }

  @SubscribeMessage('game:action')
  async gameAction(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('sessionId') sessionId: number,
    @MessageBody('action') action: GameAction,
  ) {
    // A client may only ever act as itself — never for another seat or a bot.
    if (action.playerId !== String(client.data.user.sub)) {
      throw new WsException('You can only act as yourself');
    }
    // Serialized per session: a racing action loads the state this one saved.
    const result = await this.gameRuntime.processAction(sessionId, action, {
      userPk: client.data.user.sub,
    });
    if (!result.ok) return result;
    void this.gameRuntime.runBots(sessionId);
    return result;
  }

  @SubscribeMessage('game:restart')
  async gameRestart(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('sessionId') sessionId: number,
  ) {
    const fresh = await this.sessionService.enqueue(sessionId, async () => {
      const session = await this.sessionService.findById(sessionId);
      if (
        !session ||
        !this.sessionService.isPlayer(session, client.data.user.sub)
      ) {
        throw new WsException(`Game session ${sessionId} not found`);
      }
      return this.sessionService.restart(session);
    });
    await client.join(gameRoom(sessionId));
    await this.gameRuntime.broadcastViews(fresh);
    void this.gameRuntime.runBots(sessionId);
    return this.sessionService.payloadFor(
      fresh,
      client.data.user.sub,
      [],
      this.gameRuntime.autoPlayedIn(sessionId),
    );
  }

  @SubscribeMessage('game:leave')
  async gameLeave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody('sessionId') sessionId: number,
  ): Promise<void> {
    await this.sessionService.markLeft(sessionId, client.data.user.sub);
    await client.leave(gameRoom(sessionId));
    // Termination policy: when the last human walks out, abandon the
    // session — no point running a bots-only game or holding its timers.
    const session = await this.sessionService.findById(sessionId);
    if (
      session &&
      session.status === GameSessionStatus.ACTIVE &&
      session.players.every((p) => p.leftAt !== null)
    ) {
      await this.sessionService.abandon(session);
      this.gameRuntime.clearSession(sessionId);
    }
  }
}
