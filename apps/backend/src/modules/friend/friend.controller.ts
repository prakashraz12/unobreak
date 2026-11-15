import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.ts';
import type { JwtPayload } from '../auth/auth.types.ts';
import { FriendEntryDto, FriendRequestsDto } from './friend.dto.ts';
import { FriendService } from './friend.service.ts';
import { Friendship } from './friendship.entity.ts';

@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  /** Send a friend request to a user (by their public userId). */
  @Post('request/:userId')
  sendRequest(
    @CurrentUser() { userId }: JwtPayload,
    @Param('userId', ParseIntPipe) addresseeUserId: number,
  ): Promise<Friendship> {
    return this.friendService.sendRequest(userId, addresseeUserId);
  }

  /** Accept a pending request addressed to you. */
  @Post(':id/accept')
  accept(
    @CurrentUser() { sub }: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Friendship> {
    return this.friendService.accept(id, sub);
  }

  /** Decline a request or unfriend. */
  @Delete(':id')
  remove(
    @CurrentUser() { sub }: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.friendService.remove(id, sub);
  }

  /** Accepted friends. */
  @Get()
  listFriends(@CurrentUser() { sub }: JwtPayload): Promise<FriendEntryDto[]> {
    return this.friendService.listFriends(sub);
  }

  /** Send a direct message to a friend (by their public userId). */
  @Post(':userId/messages')
  sendMessage(
    @CurrentUser() { sub }: JwtPayload,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('text') text: string,
  ) {
    return this.friendService.sendMessage(sub, userId, text ?? '');
  }

  /** Recent conversation with a friend; marks their messages as read. */
  @Get(':userId/messages')
  listMessages(
    @CurrentUser() { sub }: JwtPayload,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.friendService.listMessages(sub, userId);
  }

  /** Incoming + outgoing pending requests. */
  @Get('requests')
  listRequests(@CurrentUser() { sub }: JwtPayload): Promise<FriendRequestsDto> {
    return this.friendService.listRequests(sub);
  }
}
