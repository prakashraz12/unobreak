import { Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.ts';
import type { JwtPayload } from '../auth/auth.types.ts';

export type AuthedSocket = Socket & { data: { user: JwtPayload } };

export const LOBBY_ROOM = 'lobby';
export const matchRoom = (matchId: number) => `match:${matchId}`;
export const gameRoom = (sessionId: number) => `game:${sessionId}`;
export const userRoom = (userId: number) => `user:${userId}`;

/**
 * Verify the handshake token and seat the socket on its user room.
 * Every gateway on the namespace runs this for its own connections — it is
 * idempotent, so running it twice is harmless.
 */
export const authenticateSocket = async (
  client: Socket,
  authService: AuthService,
): Promise<{ payload: JwtPayload; wasOnline: boolean }> => {
  const token =
    client.handshake.auth?.token ??
    client.handshake.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Token not found');
  const payload = await authService.verifyAccessToken(token);
  client.data.user = payload;
  // Must be read before join() seats this socket on the user room.
  const wasOnline = client.nsp.adapter.rooms.has(userRoom(payload.sub));
  await client.join(userRoom(payload.sub));
  return { payload, wasOnline };
};
