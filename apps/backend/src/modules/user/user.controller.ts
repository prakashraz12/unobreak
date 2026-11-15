import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidateResponse } from '../../common/decorators/validate.decorator.ts';
import { Public } from '../../common/decorators/public.decorator.ts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { AuthService } from '../auth/auth.service.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import type { Env } from '../../config/env.validation.ts';
import { UserService } from './user.service.ts';
import { User } from './user.entity.ts';
import {
  CreateUserDto,
  GoogleLoginDto,
  UserCreateResponseDto,
  UserEntryListQueryDTO,
  UserListResponseDTO,
} from './user.dto.ts';
import { getMessage } from '../../messages/index.ts';

interface GoogleTokenInfo {
  aud: string;
  sub: string;
  email?: string;
}

interface GoogleUserInfo {
  name?: string;
  picture?: string;
}

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post()
  @ValidateResponse(UserCreateResponseDto)
  @Public()
  async createUser(
    @Body()
    createUserDto: CreateUserDto,
  ): Promise<UserCreateResponseDto> {
    const user = await this.userService.create(createUserDto);
    return {
      message: getMessage('user', 'CREATED'),
      data: {
        id: user.id,
        accessToken: await this.authService.signAccessToken(user),
      },
    };
  }

  @Post('google')
  @ValidateResponse(UserCreateResponseDto)
  @Public()
  async loginWithGoogle(
    @Body() { accessToken }: GoogleLoginDto,
  ): Promise<UserCreateResponseDto> {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID is not configured',
      );
    }

    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    const info = (await res.json()) as GoogleTokenInfo;
    if (!res.ok || !info.sub || !info.email) {
      throw new UnauthorizedException('Invalid Google access token');
    }
    if (info.aud !== clientId) {
      throw new UnauthorizedException(
        'Google token was not issued for this app',
      );
    }

    let profile: GoogleUserInfo = {};
    try {
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (profileRes.ok) {
        profile = (await profileRes.json()) as GoogleUserInfo;
      }
    } catch {
      // Profile image is best-effort; sign-in must not fail because of it.
    }

    const user = await this.userService.findOrCreateByGoogle({
      googleId: info.sub,
      email: info.email,
      name: profile.name ?? info.email.split('@')[0] ?? 'Player',
      picture: profile.picture,
    });

    return {
      message: getMessage('user', 'CREATED'),
      data: {
        id: user.id,
        accessToken: await this.authService.signAccessToken(user),
      },
    };
  }

  @Get('me')
  async me(@CurrentUser() { sub }: JwtPayload): Promise<User> {
    const user = await this.userService.findById(sub);
    if (!user) {
      throw new NotFoundException(getMessage('user', 'NOT_FOUND'));
    }
    return user;
  }

  @Post('all')
  @ValidateResponse(UserListResponseDTO)
  async getAllUsers(
    @Query() query: UserEntryListQueryDTO,
    @CurrentUser() { sub }: JwtPayload,
  ): Promise<UserListResponseDTO> {
    const result = await this.userService.findAllUsers(query, sub);

    return {
      message: getMessage('user', 'FETCHED'),
      data: result.data,
      pagination: result.pagination,
    };
  }
}
