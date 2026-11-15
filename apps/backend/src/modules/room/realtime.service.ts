import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { userRoom } from './socket-helpers.ts';

/**
 * Generic "emit to one online user" channel, bound to the socket server by
 * LobbyGateway on init. Any module that imports RoomModule can push events
 * (friend requests, invites, …) without owning a gateway.
 */
@Injectable()
export class RealtimeService {
  server!: Server;

  /** Emit only if the user currently has a socket connected. */
  toUserIfOnline(userPk: number, event: string, payload: unknown): boolean {
    if (!this.isOnline(userPk)) return false;
    this.server.to(userRoom(userPk)).emit(event, payload);
    return true;
  }

  toUser(userPk: number, event: string, payload: unknown) {
    this.server.to(userRoom(userPk)).emit(event, payload);
  }

  isOnline(userPk: number): boolean {
    return this.server.sockets.adapter.rooms.has(userRoom(userPk));
  }
}
