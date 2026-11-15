import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity.ts';
import type { GameSession } from './game-session.entity.ts';

/** Seat assignment for a session — carries turn order and outcome per player. */
@Entity('game_session_players')
@Unique(['session', 'user'])
@Unique(['session', 'seat'])
export class GameSessionPlayer {
  @PrimaryGeneratedColumn()
  id: number;

  // String entity name + type-only import: breaks the runtime circular
  // dependency with game-session.entity.ts under ESM.
  @ManyToOne('GameSession', (session: GameSession) => session.players, {
    onDelete: 'CASCADE',
  })
  session: GameSession;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  /** Turn order index (0-based), matching the seat in engine state. */
  @Column({ type: 'int' })
  seat: number;

  /** Team id for team matches (e.g. 2v2); null in free-for-all games. */
  @Column({ type: 'int', nullable: true })
  team: number | null;

  /** Final placement once the session ends (1 = winner). */
  @Column({ type: 'int', nullable: true })
  placement: number | null;

  /** Set when the player leaves or forfeits mid-game. */
  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date | null;
}
