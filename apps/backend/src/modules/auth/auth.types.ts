import type { Request } from 'express';

export interface JwtPayload {
  sub: number;
  userId: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
