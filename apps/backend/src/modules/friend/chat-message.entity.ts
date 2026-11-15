import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity.ts';
import { BaseEntity } from '../../common/entity/base.entity.ts';

/** A direct message between two friends. */
@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  @Column({ type: 'text' })
  text: string;

  /** Set when the recipient fetches history containing this message. */
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
