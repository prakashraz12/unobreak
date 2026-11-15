import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from '../room/room.module.ts';
import { User } from '../user/user.entity.ts';
import { ChatMessage } from './chat-message.entity.ts';
import { FriendController } from './friend.controller.ts';
import { FriendService } from './friend.service.ts';
import { Friendship } from './friendship.entity.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship, User, ChatMessage]),
    RoomModule,
  ],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}
