import { describe, expect, it } from 'vitest';
import { MatchService } from './match.service.ts';
import type { Match } from './match.entity.ts';
import type { User } from '../user/user.entity.ts';
import { MatchStatus, MatchType } from '../../common/constant.ts';

/**
 * In-memory stand-in for Repository + EntityManager. Implements only the
 * surface MatchService touches: transactions run inline, the row "lock" is
 * a lookup, and the update query-builder marks rows cancelled.
 */
const makeUser = (id: number): User =>
  ({ id, userId: id * 100, name: `P${id}`, avatarId: 1 }) as User;

const makeMatch = (
  id: number,
  players: User[],
  overrides: Partial<Match> = {},
): Match =>
  ({
    id,
    players,
    status: MatchStatus.FINDING,
    type: MatchType.SOLO,
    partnerId: null,
    seats: null,
    expiresAt: null,
    requestId: null,
    ...overrides,
  }) as Match;

// The service calls manager.findOneBy(User | Match, ...) — discriminate on
// the class to route to the right table.
import { User as UserEntity } from '../user/user.entity.ts';
import { Match as MatchEntity } from './match.entity.ts';

const makeService = (db: { matches: Match[]; users: User[] }) => {
  const findBy = <T extends { id: number }>(
    rows: T[],
    where: Record<string, unknown>,
  ) =>
    rows.find((r) =>
      Object.entries(where).every(([k, v]) => {
        if (k === 'requestId' && v === null) return false;
        return (r as Record<string, unknown>)[k] === v;
      }),
    ) ?? null;

  const qb = () => {
    let params: Record<string, unknown> = {};
    let ids: number[] = [];
    const chain = {
      setLock: () => chain,
      leftJoinAndSelect: () => chain,
      innerJoin: (
        _e?: string,
        _a?: string,
        _c?: string,
        p?: Record<string, unknown>,
      ) => {
        if (p) params = { ...params, ...p };
        return chain;
      },
      where: (_c: string, p: Record<string, unknown>) => {
        params = { ...params, ...p };
        return chain;
      },
      andWhere: () => chain,
      orderBy: () => chain,
      update: () => chain,
      set: () => chain,
      whereInIds: (inIds: number[]) => {
        ids = inIds;
        return chain;
      },
      getOne: async () => {
        if (params.matchId !== undefined) {
          return db.matches.find((m) => m.id === params.matchId) ?? null;
        }
        return null; // friendships etc.
      },
      getMany: async () =>
        db.matches.filter(
          (m) =>
            m.status === MatchStatus.FINDING &&
            m.players.some((p) => p.id === params.userPk),
        ),
      execute: async () => {
        for (const m of db.matches) {
          if (ids.includes(m.id)) m.status = MatchStatus.CANCELLED;
        }
      },
    };
    return chain;
  };

  const matchRepo: Record<string, unknown> = {};
  const manager = {
    transaction: async <T>(fn: (m: unknown) => Promise<T>) => fn(manager),
    findOneBy: async (entity: unknown, where: Record<string, unknown>) => {
      if (entity === UserEntity) return findBy(db.users, where);
      if (entity === MatchEntity) return findBy(db.matches, where);
      return null;
    },
    getRepository: (entity: unknown) => {
      if (entity === MatchEntity) return matchRepo;
      return { createQueryBuilder: qb };
    },
    query: async (_sql: string, params: number[]) => {
      const [matchId, userPk] = params;
      const m = db.matches.find((x) => x.id === matchId);
      if (m) m.players = m.players.filter((p) => p.id !== userPk);
    },
  };
  Object.assign(matchRepo, {
    create: (cfg: Partial<Match>) => cfg as Match,
    save: async (m: Match) => {
      if (m.id === undefined) {
        m.id = Math.max(0, ...db.matches.map((x) => x.id)) + 1;
        db.matches.push(m);
      }
      return m;
    },
    createQueryBuilder: qb,
    manager,
    findOne: async ({ where }: { where: { id: number } }) =>
      db.matches.find((m) => m.id === where.id) ?? null,
    findOneBy: async (where: Record<string, unknown>) =>
      findBy(db.matches, where),
    find: async (opts?: { where?: { status?: MatchStatus } }) =>
      opts?.where?.status !== undefined
        ? db.matches.filter((m) => m.status === opts.where!.status)
        : db.matches,
    update: async ({ id }: { id: number }, patch: Partial<Match>) => {
      const m = db.matches.find((x) => x.id === id);
      if (m) Object.assign(m, patch);
    },
  });
  return new MatchService(matchRepo as never);
};

describe('MatchService.createMatch', () => {
  it('is idempotent on requestId — retries return the same ticket', async () => {
    const db = { matches: [] as Match[], users: [makeUser(1)] };
    const service = makeService(db);
    const first = await service.createMatch(100, MatchType.SOLO, 'req-1');
    const second = await service.createMatch(100, MatchType.SOLO, 'req-1');
    expect(second.id).toBe(first.id);
    expect(db.matches).toHaveLength(1);
  });

  it('sets a server deadline on solo tickets only', async () => {
    const db = { matches: [] as Match[], users: [makeUser(1)] };
    const service = makeService(db);
    const solo = await service.createMatch(100, MatchType.SOLO);
    expect(solo.expiresAt).not.toBeNull();
    const room = await service.createMatch(100, MatchType.PRIVATE_ROOM);
    expect(room.expiresAt).toBeNull();
  });

  it('cancels the user’s other open tickets — one ticket per user', async () => {
    const u1 = makeUser(1);
    const old = makeMatch(1, [u1]);
    const db = { matches: [old], users: [u1] };
    const service = makeService(db);
    const fresh = await service.createMatch(100, MatchType.SOLO);
    expect(old.status).toBe(MatchStatus.CANCELLED);
    expect(fresh.status).toBe(MatchStatus.FINDING);
  });
});

describe('MatchService.joinMatch', () => {
  it('seats players up to 4 and rejects the fifth', async () => {
    const users = [1, 2, 3, 4, 5].map(makeUser);
    const match = makeMatch(1, [users[0]!]);
    const db = { matches: [match], users };
    const service = makeService(db);
    for (const u of users.slice(1, 4)) {
      await service.joinMatch(1, u.userId);
    }
    expect(match.players).toHaveLength(4);
    await expect(service.joinMatch(1, 500)).rejects.toThrow('full');
  });

  it('same user joining twice keeps one seat (idempotent)', async () => {
    const u = makeUser(1);
    const match = makeMatch(1, [u]);
    const db = { matches: [match], users: [u] };
    const service = makeService(db);
    const again = await service.joinMatch(1, 100);
    expect(again.players).toHaveLength(1);
  });

  it('rejects joins after expiry and after leaving FINDING', async () => {
    const u = makeUser(2);
    const expired = makeMatch(1, [makeUser(1)], {
      expiresAt: new Date(Date.now() - 1000),
    });
    const started = makeMatch(2, [makeUser(1)], {
      status: MatchStatus.JOINED,
    });
    const db = { matches: [expired, started], users: [makeUser(1), u] };
    const service = makeService(db);
    await expect(service.joinMatch(1, 200)).rejects.toThrow('expired');
    await expect(service.joinMatch(2, 200)).rejects.toThrow('not found');
    expect(started.players).toHaveLength(1);
  });

  it('joining cancels the user’s previous ticket', async () => {
    const u1 = makeUser(1);
    const u2 = makeUser(2);
    const mine = makeMatch(1, [u2]);
    const theirs = makeMatch(2, [u1]);
    const db = { matches: [mine, theirs], users: [u1, u2] };
    const service = makeService(db);
    await service.joinMatch(2, 200);
    expect(mine.status).toBe(MatchStatus.CANCELLED);
    expect(theirs.players).toHaveLength(2);
  });
});

describe('MatchService.markJoined', () => {
  it('flips FINDING -> JOINED once; concurrent starts see null', async () => {
    const match = makeMatch(1, [makeUser(1)]);
    const service = makeService({ matches: [match], users: [] });
    const first = await service.markJoined(1);
    const second = await service.markJoined(1);
    expect(first?.status).toBe(MatchStatus.JOINED);
    expect(second).toBeNull();
  });
});

describe('MatchService.findMatch', () => {
  it('hides expired and invite-only tickets; completed never listed', async () => {
    const u = makeUser(9);
    const db = {
      matches: [
        makeMatch(1, [makeUser(1)]), // public open
        makeMatch(2, [makeUser(1)], {
          expiresAt: new Date(Date.now() - 1),
        }), // expired
        makeMatch(3, [makeUser(1)], { type: MatchType.PRIVATE_ROOM }),
        makeMatch(4, [u], { type: MatchType.PRIVATE_ROOM }), // mine
        makeMatch(5, [makeUser(1)], { status: MatchStatus.JOINED }),
      ],
      users: [u],
    };
    const service = makeService(db);
    const listed = await service.findMatch(900);
    expect(listed.map((m) => m.id)).toEqual([1, 4]);
  });
});

describe('MatchService.configure', () => {
  const room = (players: User[]) =>
    makeMatch(1, players, { type: MatchType.PRIVATE_ROOM });

  it('only the creator may configure and seats must be seated players', async () => {
    const players = [makeUser(1), makeUser(2)];
    const service = makeService({
      matches: [room(players)],
      users: players,
    });
    await expect(service.configure(1, 2, [2, 1, null, null])).rejects.toThrow(
      'creator',
    );
    await expect(service.configure(1, 1, [1, 99, null, null])).rejects.toThrow(
      'Invalid',
    );
    await expect(service.configure(1, 1, [1, 1, null, null])).rejects.toThrow(
      'Invalid',
    );
    const saved = await service.configure(1, 1, [1, 2, null, null]);
    expect(saved.seats).toEqual([1, 2, null, null]);
  });
});
