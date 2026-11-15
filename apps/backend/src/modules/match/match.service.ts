import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { Match } from './match.entity.ts';
import { User } from '../user/user.entity.ts';
import { Friendship } from '../friend/friendship.entity.ts';
import {
  FriendshipStatus,
  MatchStatus,
  MatchType,
} from '../../common/constant.ts';

const SEATS = 4;
/** PostgreSQL unique-violation code — used for idempotency fallbacks. */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  /** A FINDING ticket past its server deadline accepts no more players. */
  isExpired(match: Match): boolean {
    return match.expiresAt !== null && match.expiresAt.getTime() <= Date.now();
  }

  /** Lock a match row inside `manager`'s transaction and load its players. */
  private lockMatch(manager: EntityManager, matchId: number) {
    return manager
      .getRepository(Match)
      .createQueryBuilder('m')
      .setLock('pessimistic_write', undefined, ['m'])
      .leftJoinAndSelect('m.players', 'p')
      .where('m.id = :matchId', { matchId })
      .getOne();
  }

  /** FINDING matches still seating `userPk`, inside `manager`'s txn. */
  private openTicketsOf(manager: EntityManager, userPk: number) {
    return manager
      .getRepository(Match)
      .createQueryBuilder('m')
      .innerJoin('m.players', 'p', 'p.id = :userPk', { userPk })
      .where('m.status = :status', { status: MatchStatus.FINDING })
      .getMany();
  }

  /** Cancel every other open ticket the user holds — one ticket per user. */
  private async cancelOtherTickets(
    manager: EntityManager,
    userPk: number,
    keepId?: number,
  ) {
    const open = await this.openTicketsOf(manager, userPk);
    const stale = open.filter((m) => m.id !== keepId);
    if (stale.length === 0) return;
    await manager
      .getRepository(Match)
      .createQueryBuilder()
      .update()
      .set({ status: MatchStatus.CANCELLED })
      .whereInIds(stale.map((m) => m.id))
      .execute();
  }

  /**
   * Create a matchmaking ticket. Idempotent on `requestId`: a retry after a
   * lost ack (or the HTTP fallback) returns the original match. Creating a
   * ticket also cancels any other open ticket the user is still seated in —
   * one player, one live queue.
   */
  async createMatch(
    userId: number,
    type: MatchType = MatchType.SOLO,
    requestId?: string,
    ttlMs?: number,
  ) {
    try {
      return await this.matchRepository.manager.transaction(async (manager) => {
        if (requestId) {
          const existing = await manager.findOneBy(Match, {
            requestId,
          });
          if (existing) return existing;
        }
        const user = await manager.findOneBy(User, { userId });
        if (!user) {
          throw new NotFoundException(`User ${userId} not found`);
        }
        await this.cancelOtherTickets(manager, user.id);
        const match = manager.getRepository(Match).create({
          players: [user],
          status: MatchStatus.FINDING,
          type,
          requestId: requestId ?? null,
          // Public queues expire server-side; invite lobbies wait
          // for their host instead.
          expiresAt:
            type === MatchType.SOLO
              ? new Date(Date.now() + (ttlMs ?? 120_000))
              : null,
        });
        return manager.getRepository(Match).save(match);
      });
    } catch (err) {
      // Concurrent creates with the same requestId race the unique index —
      // the loser returns the winner's ticket.
      if (
        requestId &&
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        const existing = await this.matchRepository.findOneBy({
          requestId,
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async findById(matchId: number) {
    return this.matchRepository.findOne({
      where: { id: matchId },
      relations: { players: true },
    });
  }

  /** Every FINDING match that still has this user seated (they own it). */
  async findOpenByPlayer(userPk: number) {
    return this.matchRepository
      .createQueryBuilder('m')
      .innerJoin('m.players', 'p', 'p.id = :userPk', { userPk })
      .where('m.status = :status', { status: MatchStatus.FINDING })
      .getMany();
  }

  async setStatus(matchId: number, status: MatchStatus) {
    await this.matchRepository.update({ id: matchId }, { status });
    return this.findById(matchId);
  }

  /** All FINDING team tickets besides `excludeId`, oldest first. */
  findSearchingTeamMatches(excludeId: number) {
    return this.matchRepository
      .find({
        where: { status: MatchStatus.FINDING, type: MatchType.TEAM_2V2 },
        relations: { players: true },
        order: { createdAt: 'ASC' },
      })
      .then((rows) => rows.filter((m) => m.id !== excludeId));
  }

  /** Merge another match's players into `match` (team-vs-team pairing). */
  addPlayers(match: Match, players: User[]) {
    match.players = [...match.players, ...players];
    return this.matchRepository.save(match);
  }

  async findMatch(userId?: number) {
    // Invite-only tickets are hidden from the list unless the requester
    // is seated; expired tickets are never listed again.
    const all = await this.matchRepository.find({
      where: { status: MatchStatus.FINDING },
      relations: { players: true },
    });
    return all.filter((m) => {
      if (this.isExpired(m)) return false;
      const inviteOnly =
        m.type === MatchType.TEAM_2V2 || m.type === MatchType.PRIVATE_ROOM;
      return (
        !inviteOnly ||
        (userId !== undefined && m.players.some((p) => p.userId === userId))
      );
    });
  }

  /**
   * Seat a player in a ticket. Everything that can race — status flip,
   * expiry, seat count, duplicate seats, the user's other tickets — is
   * checked while holding the match row lock.
   */
  async joinMatch(matchId: number, userId: number) {
    return this.matchRepository.manager.transaction(async (manager) => {
      const match = await this.lockMatch(manager, matchId);
      if (!match || match.status !== MatchStatus.FINDING) {
        throw new NotFoundException(`Match ${matchId} not found`);
      }
      if (this.isExpired(match)) {
        throw new BadRequestException(`Match ${matchId} already expired`);
      }
      const user = await manager.findOneBy(User, { userId });
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }
      if (match.players.some((player) => player.id === user.id)) {
        return match;
      }
      if (match.players.length >= SEATS) {
        throw new BadRequestException(`Match ${matchId} is full`);
      }
      await this.cancelOtherTickets(manager, user.id, match.id);
      match.players.push(user);
      return manager.getRepository(Match).save(match);
    });
  }

  /**
   * Atomically flip FINDING -> JOINED. Returns the locked match on success,
   * null when another request already transitioned it — the caller then
   * loads the session that transition spawned (idempotent start).
   */
  async markJoined(matchId: number): Promise<Match | null> {
    return this.matchRepository.manager.transaction(async (manager) => {
      const match = await this.lockMatch(manager, matchId);
      if (!match || match.status !== MatchStatus.FINDING) return null;
      match.status = MatchStatus.JOINED;
      return manager.getRepository(Match).save(match);
    });
  }

  /** Two users are friends iff an ACCEPTED friendship exists either way. */
  private async areFriends(aPk: number, bPk: number): Promise<boolean> {
    const found = await this.matchRepository.manager
      .getRepository(Friendship)
      .createQueryBuilder('f')
      .innerJoin('f.requester', 'req')
      .innerJoin('f.addressee', 'addr')
      .where(
        '(req.id = :a AND addr.id = :b) OR (req.id = :b AND addr.id = :a)',
        { a: aPk, b: bPk },
      )
      .andWhere('f.status = :status', {
        status: FriendshipStatus.ACCEPTED,
      })
      .getOne();
    return found !== null;
  }

  /**
   * Invite a friend into a match. For team matches the first invitee is
   * remembered as the creator's partner and seated across the table.
   * Returns the target user so the gateway can push them a notification.
   */
  async invite(matchId: number, inviterPk: number, targetUserId: number) {
    const match = await this.findById(matchId);
    if (!match || match.status !== MatchStatus.FINDING) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }
    if (this.isExpired(match)) {
      throw new BadRequestException(`Match ${matchId} already expired`);
    }
    if (!match.players.some((p) => p.id === inviterPk)) {
      throw new BadRequestException('You are not in this match');
    }
    const target = await this.matchRepository.manager.findOneBy(User, {
      userId: targetUserId,
    });
    if (!target) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }
    if (match.players.some((p) => p.id === target.id)) {
      throw new BadRequestException('They are already in this match');
    }
    if (!(await this.areFriends(inviterPk, target.id))) {
      throw new BadRequestException('You can only invite friends');
    }
    if (match.type === MatchType.TEAM_2V2 && match.partnerId === null) {
      match.partnerId = target.id;
      await this.matchRepository.save(match);
    }
    // Custom lobbies cap at a full table — inviting beyond 4 would
    // strand the invitee on a full match when they accept.
    if (match.type === MatchType.PRIVATE_ROOM && match.players.length >= 4) {
      throw new BadRequestException('The lobby is full');
    }
    return { match, target };
  }

  /**
   * Remove a seated player from a ticket (lock-free read first, atomic
   * delete on the join row). Returns the match afterwards, or null when
   * the match is gone.
   */
  async removePlayer(matchId: number, userPk: number) {
    return this.matchRepository.manager.transaction(async (manager) => {
      const match = await this.lockMatch(manager, matchId);
      if (!match || match.status !== MatchStatus.FINDING) return match;
      await manager.query(
        `DELETE FROM "match_players_users" WHERE "matchId" = $1 AND "usersId" = $2`,
        [matchId, userPk],
      );
      match.players = match.players.filter((p) => p.id !== userPk);
      return match;
    });
  }

  /**
   * Set a custom match's seat layout. Only the creator may configure, and
   * every named seat must be a seated player. `null` seats mean
   * free-for-all; a 4-slot array pins users.id (or null = bot) to seats,
   * with teams as 0&2 vs 1&3.
   */
  async configure(
    matchId: number,
    userPk: number,
    seats: (number | null)[] | null,
  ) {
    const match = await this.findById(matchId);
    if (
      !match ||
      match.status !== MatchStatus.FINDING ||
      match.type !== MatchType.PRIVATE_ROOM
    ) {
      throw new NotFoundException(`Match ${matchId} not found`);
    }
    if (match.players[0]?.id !== userPk) {
      throw new BadRequestException(
        'Only the match creator can configure seats',
      );
    }
    if (seats !== null) {
      const seated = new Set(match.players.map((p) => p.id));
      const named = seats.filter((s): s is number => s !== null);
      if (
        (seats.length !== 2 && seats.length !== 4) ||
        named.length !== new Set(named).size ||
        named.some((id) => !seated.has(id))
      ) {
        throw new BadRequestException('Invalid seat layout');
      }
    }
    match.seats = seats;
    return this.matchRepository.save(match);
  }
}
