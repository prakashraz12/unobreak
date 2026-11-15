import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import { Friendship } from '../friend/friendship.entity.ts';
import { FriendRelation, FriendshipStatus } from '../../common/constant.ts';
import { generateUserId } from '../../util/generate-userid.js';
import { CreateUserDto, UserEntryListQueryDTO } from './user.dto.js';
import { clampPageSize } from '../../common/dto/pagination.dto.ts';
import { getPaginationResponse } from '../../common/utils/get-peginated-response.ts';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendships: Repository<Friendship>,
  ) {}

  //utils
  private mapUser(user: User, friendStatus: FriendRelation) {
    return {
      userId: user.userId,
      name: user.name,
      avatarId: user.avatarId,
      customProfileImage: user.customProfileImage,
      activity: user.activity,
      friendStatus,
    };
  }

  /** Your relationship to each user id: friend, pending out/in, or none. */
  private async friendStatusFor(selfId: number, userPks: number[]) {
    if (userPks.length === 0) return new Map<number, FriendRelation>();
    const rows = await this.friendships
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.requester', 'req')
      .innerJoinAndSelect('f.addressee', 'addr')
      .where(
        '(req.id = :me AND addr.id IN (:...userPks)) OR (addr.id = :me AND req.id IN (:...userPks))',
        { me: selfId, userPks },
      )
      .getMany();
    const map = new Map<number, FriendRelation>();
    for (const f of rows) {
      const otherId =
        f.requester.id === selfId ? f.addressee.id : f.requester.id;
      map.set(
        otherId,
        f.status === FriendshipStatus.ACCEPTED
          ? FriendRelation.FRIEND
          : f.requester.id === selfId
            ? FriendRelation.OUTGOING
            : FriendRelation.INCOMING,
      );
    }
    return map;
  }

  async findAllUsers(query: UserEntryListQueryDTO, selfId: number) {
    const search = query?.search?.trim();
    const page = Math.max(query?.page ?? 0, 0);
    const take = clampPageSize(query?.take);

    const qb = this.users
      .createQueryBuilder('u')
      .where('u.id != :selfId', { selfId });

    if (search) {
      qb.andWhere('(u.name = :search OR CAST(u.userId AS TEXT) = :search)', {
        search,
      });
    }

    // Existing friends don't belong in the player discovery list.
    qb.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = :acceptedStatus
          AND ((f."requesterId" = :selfId AND f."addresseeId" = u.id)
            OR (f."addresseeId" = :selfId AND f."requesterId" = u.id))
      )`,
      { acceptedStatus: FriendshipStatus.ACCEPTED },
    );

    const [rows, total] = await qb
      .orderBy("u.activity->>'isOnline'", 'DESC')
      .addOrderBy('u.createdAt', 'DESC')
      .skip(page * take)
      .take(take)
      .getManyAndCount();

    const statusMap = await this.friendStatusFor(
      selfId,
      rows.map((u) => u.id),
    );

    return {
      data: rows.map((user) =>
        this.mapUser(user, statusMap.get(user.id) ?? FriendRelation.NONE),
      ),
      pagination: getPaginationResponse(rows, total, { page, take }),
    };
  }

  async findOrCreateByGoogle(data: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<User> {
    const byGoogleId = await this.users.findOneBy({ googleId: data.googleId });
    if (byGoogleId) {
      if (data.picture && byGoogleId.customProfileImage !== data.picture) {
        byGoogleId.customProfileImage = data.picture;
        return this.users.save(byGoogleId);
      }
      return byGoogleId;
    }

    const byEmail = await this.users.findOneBy({ email: data.email });
    if (byEmail) {
      byEmail.googleId = data.googleId;
      byEmail.isEmailVerified = true;
      if (data.picture && !byEmail.customProfileImage) {
        byEmail.customProfileImage = data.picture;
      }
      return this.users.save(byEmail);
    }

    let generatedUserId = generateUserId();
    while (await this.users.existsBy({ userId: generatedUserId })) {
      generatedUserId = generateUserId();
    }
    return this.users.save(
      this.users.create({
        name: data.name,
        email: data.email,
        googleId: data.googleId,
        isEmailVerified: true,
        customProfileImage: data.picture ?? null,
        userId: generatedUserId,
        avatarId: Math.floor(Math.random() * 12),
        activity: { isOnline: true, lastActive: new Date() },
      }),
    );
  }

  findById(id: number): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  async setOnline(id: number, isOnline: boolean): Promise<void> {
    await this.users.update(id, {
      activity: { isOnline, lastActive: new Date() },
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    let generatedUserId = generateUserId();
    while (await this.users.existsBy({ userId: generatedUserId })) {
      generatedUserId = generateUserId();
    }
    const user = {
      ...data,
      userId: generatedUserId,
      activity: { isOnline: true, lastActive: new Date() },
    };
    return this.users.save(this.users.create(user));
  }
}
