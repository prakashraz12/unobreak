import { User } from '../user/user.entity.ts';
import { Friendship } from './friendship.entity.ts';

export class FriendEntryDto {
  friendshipId: number;
  user: User;
}

export class FriendRequestsDto {
  incoming: Friendship[];
  outgoing: Friendship[];
}
