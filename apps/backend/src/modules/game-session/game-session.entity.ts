import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import type { GameState } from '@repo/game-engine';
import { Match } from '../match/match.entity.ts';
import { User } from '../user/user.entity.ts';
import { GameSessionStatus } from '../../common/constant.ts';
import { BaseEntity } from '../../common/entity/base.entity.ts';
import { GameSessionPlayer } from './game-session-player.entity.ts';

/** A live game spawned from a match — holds the authoritative engine state. */
@Entity('game_sessions')
export class GameSession extends BaseEntity {
  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  match: Match;

  @Column({ type: 'enum', enum: GameSessionStatus })
  status: GameSessionStatus;

  /** Engine RNG seed — server secret, never sent to clients. */
  @Column({ type: 'int' })
  seed: number;

  /** Authoritative engine state — persisted after every action. */
  @Column({ type: 'jsonb' })
  state: GameState;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  winner: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @OneToMany(() => GameSessionPlayer, (player) => player.session, {
    cascade: true,
  })
  players: GameSessionPlayer[];
}
