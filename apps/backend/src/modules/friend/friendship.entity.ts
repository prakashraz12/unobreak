import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { User } from '../user/user.entity.ts';
import { FriendshipStatus } from '../../common/constant.ts';
import { BaseEntity } from '../../common/entity/base.entity.ts';

/** A friend request / friendship between two users. */
@Entity('friendships')
@Unique(['requester', 'addressee'])
export class Friendship extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  requester: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  addressee: User;

  @Column({ type: 'enum', enum: FriendshipStatus })
  status: FriendshipStatus;
}
