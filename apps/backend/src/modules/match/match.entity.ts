import { Entity, ManyToMany, JoinTable, Column } from 'typeorm';
import { User } from '../user/user.entity.ts';
import { MatchStatus, MatchType } from '../../common/constant.ts';
import { BaseEntity } from '../../common/entity/base.entity.ts';

@Entity()
export class Match extends BaseEntity {
  @ManyToMany(() => User)
  @JoinTable()
  players: User[];

  @Column({ type: 'enum', enum: MatchStatus })
  status: MatchStatus;

  @Column({ type: 'enum', enum: MatchType })
  type: MatchType;

  /**
   * The invited partner for team matches (users.id). When set, that player
   * is seated across the table from the creator (seat 2) and the match can
   * only start once they've joined.
   */
  @Column({ type: 'int', nullable: true })
  partnerId: number | null;

  /**
   * Explicit seat layout for custom (PRIVATE_ROOM) matches, set by the host
   * via `match:configure`: users.id (or null = bot) at each of the 4 seats
   * in table order. Teams land as seats 0&2 vs 1&3 — Team A occupies the
   * even seats. Null means free-for-all (no teams).
   */
  @Column({ type: 'jsonb', nullable: true })
  seats: (number | null)[] | null;

  /**
   * Server-authoritative matchmaking deadline. When it passes the ticket is
   * expired: no more joins, and the server launches it with bots filling the
   * empty seats. Null = no expiry (invite lobbies wait for the host).
   */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /**
   * Client-supplied idempotency key for ticket creation. A retry (lost ack,
   * HTTP fallback) with the same key returns the original match instead of
   * opening a second ticket.
   */
  @Column({ type: 'varchar', nullable: true })
  requestId: string | null;
}
