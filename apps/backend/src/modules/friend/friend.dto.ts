import { User } from '../user/user.entity.ts';
import { Friendship } from './friendship.entity.ts';

export class FriendEntryDto {
  friendshipId: number;
  user: User;
  /** Messages from this friend I haven't read yet. */
  unreadCount: number;
}

export class FriendRequestsDto {
  incoming: Friendship[];
  outgoing: Friendship[];
}
