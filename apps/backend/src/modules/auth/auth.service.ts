import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../user/user.entity.ts';
import type { JwtPayload } from './auth.types.ts';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(user: Pick<User, 'id' | 'userId'>): Promise<string> {
    const payload: JwtPayload = { sub: user.id, userId: user.userId };
    return this.jwtService.signAsync(payload);
  }

  verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
