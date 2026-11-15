import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import { MatchType } from '../../common/constant.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { Match } from './match.entity.ts';
import { MatchService } from './match.service.ts';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  createMatch(
    @CurrentUser() { userId }: JwtPayload,
    @Body('type') type?: MatchType,
    @Body('requestId') requestId?: string,
  ): Promise<Match> {
    return this.matchService.createMatch(
      userId,
      type && Object.values(MatchType).includes(type) ? type : MatchType.SOLO,
      typeof requestId === 'string' ? requestId : undefined,
    );
  }

  @Get()
  findMatches(@CurrentUser() { userId }: JwtPayload): Promise<Match[]> {
    return this.matchService.findMatch(userId);
  }
}
