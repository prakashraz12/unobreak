import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/constant.ts';
import type { AuthenticatedRequest, JwtPayload } from './auth.types.ts';

type WsClient = {
  data: { user?: JwtPayload };
  handshake?: {
    auth?: { token?: string };
    headers?: { authorization?: string };
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient<WsClient>();
      if (client.data?.user) {
        return true;
      }
      const token =
        client.handshake?.auth?.token ??
        client.handshake?.headers?.authorization?.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException('Token not found');
      }
      try {
        client.data.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      (request as AuthenticatedRequest).user =
        await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}
