import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendshipStatus } from '../../common/constant.ts';
import { RealtimeService } from '../room/realtime.service.ts';
import { User } from '../user/user.entity.ts';
import { ChatMessage } from './chat-message.entity.ts';
import { Friendship } from './friendship.entity.ts';

const MAX_MESSAGE_LEN = 500;
const HISTORY_PAGE_SIZE = 50;

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendships: Repository<Friendship>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    private readonly realtime: RealtimeService,
  ) {}

  private findByUserId(userId: number): Promise<User | null> {
    return this.users.findOneBy({ userId });
  }

  /**
   * Send a friend request. If the other user already sent you a pending one,
   * it's accepted instead — you both wanted the same thing.
   */
  async sendRequest(
    requesterUserId: number,
    addresseeUserId: number,
  ): Promise<Friendship> {
    if (requesterUserId === addresseeUserId) {
      throw new BadRequestException('You cannot friend yourself');
    }
    const [requester, addressee] = await Promise.all([
      this.findByUserId(requesterUserId),
      this.findByUserId(addresseeUserId),
    ]);
    if (!requester || !addressee) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.friendships
      .createQueryBuilder('f')
      .innerJoin('f.requester', 'req')
      .innerJoin('f.addressee', 'addr')
      .where(
        '(req.id = :a AND addr.id = :b) OR (req.id = :b AND addr.id = :a)',
        { a: requester.id, b: addressee.id },
      )
      .getOne();

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('Already friends');
      }
      // Their pending request to you counts as both accepting.
      if (
        existing.status === FriendshipStatus.PENDING &&
        existing.addressee.id === requester.id
      ) {
        existing.status = FriendshipStatus.ACCEPTED;
        const saved = await this.friendships.save(existing);
        this.notifyAccepted(saved);
        return saved;
      }
      // A declined/stale request gets re-opened.
      existing.status = FriendshipStatus.PENDING;
      existing.requester = requester;
      existing.addressee = addressee;
      const saved = await this.friendships.save(existing);
      this.notifyRequest(saved);
      return saved;
    }

    const saved = await this.friendships.save(
      this.friendships.create({
        requester,
        addressee,
        status: FriendshipStatus.PENDING,
      }),
    );
    this.notifyRequest(saved);
    return saved;
  }

  /** Realtime popup to the addressee if they're online. */
  private notifyRequest(friendship: Friendship) {
    this.realtime.toUserIfOnline(friendship.addressee.id, 'friend:request', {
      friendshipId: friendship.id,
      from: {
        userId: friendship.requester.userId,
        name: friendship.requester.name,
        avatarId: friendship.requester.avatarId,
      },
    });
  }

  /** Realtime popup to the requester when their request is accepted. */
  private notifyAccepted(friendship: Friendship) {
    this.realtime.toUserIfOnline(friendship.requester.id, 'friend:accepted', {
      friendshipId: friendship.id,
      by: {
        userId: friendship.addressee.userId,
        name: friendship.addressee.name,
        avatarId: friendship.addressee.avatarId,
      },
    });
  }

  /** Accept a pending request — only the addressee may. */
  async accept(requestId: number, userPk: number): Promise<Friendship> {
    const request = await this.friendships.findOne({
      where: { id: requestId },
      relations: { requester: true, addressee: true },
    });
    if (!request || request.status !== FriendshipStatus.PENDING) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.addressee.id !== userPk) {
      throw new BadRequestException('Only the addressee can accept');
    }
    request.status = FriendshipStatus.ACCEPTED;
    const saved = await this.friendships.save(request);
    this.notifyAccepted(saved);
    return saved;
  }

  /** Decline a request or remove a friend — either side may. */
  async remove(requestId: number, userPk: number): Promise<void> {
    const request = await this.friendships.findOne({
      where: { id: requestId },
      relations: { requester: true, addressee: true },
    });
    if (!request) throw new NotFoundException('Friend request not found');
    if (request.requester.id !== userPk && request.addressee.id !== userPk) {
      throw new BadRequestException('Not your friend request');
    }
    await this.friendships.remove(request);
  }

  /** Accepted friends: returns the other user per friendship. */
  async listFriends(
    userPk: number,
  ): Promise<{ friendshipId: number; user: User; unreadCount: number }[]> {
    const [rows, unread] = await Promise.all([
      this.friendships
        .createQueryBuilder('f')
        .innerJoinAndSelect('f.requester', 'req')
        .innerJoinAndSelect('f.addressee', 'addr')
        .where('f.status = :status', { status: FriendshipStatus.ACCEPTED })
        .andWhere('(req.id = :me OR addr.id = :me)', { me: userPk })
        .getMany(),
      this.messages
        .createQueryBuilder('m')
        .select('"m"."senderId"', 'senderId')
        .addSelect('COUNT(*)', 'count')
        .where('"m"."recipientId" = :me AND "m"."readAt" IS NULL', {
          me: userPk,
        })
        .groupBy('"m"."senderId"')
        .getRawMany<{ senderId: number; count: string }>(),
    ]);
    const unreadBy = new Map(
      unread.map((u) => [Number(u.senderId), Number(u.count)]),
    );
    return rows.map((f) => {
      const user = f.requester.id === userPk ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        user,
        unreadCount: unreadBy.get(user.id) ?? 0,
      };
    });
  }

  /** Two users are friends iff an ACCEPTED friendship exists either way. */
  private async areFriends(aPk: number, bPk: number): Promise<boolean> {
    const found = await this.friendships
      .createQueryBuilder('f')
      .innerJoin('f.requester', 'req')
      .innerJoin('f.addressee', 'addr')
      .where(
        '(req.id = :a AND addr.id = :b) OR (req.id = :b AND addr.id = :a)',
        { a: aPk, b: bPk },
      )
      .andWhere('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .getOne();
    return found !== null;
  }

  /**
   * Persist a DM and push it to the recipient's user room so it lands live.
   * Only friends may message each other.
   */
  async sendMessage(
    senderPk: number,
    recipientUserId: number,
    text: string,
  ): Promise<ChatMessage> {
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LEN);
    if (!trimmed) throw new BadRequestException('Message is empty');
    const recipient = await this.users.findOneBy({ userId: recipientUserId });
    if (!recipient) throw new NotFoundException('User not found');
    if (recipient.id === senderPk) {
      throw new BadRequestException('You cannot message yourself');
    }
    if (!(await this.areFriends(senderPk, recipient.id))) {
      throw new BadRequestException('You can only message friends');
    }
    const sender = await this.users.findOneByOrFail({ id: senderPk });
    const saved = await this.messages.save(
      this.messages.create({ sender, recipient, text: trimmed }),
    );
    // Replying means the sender has seen the thread.
    await this.markRead(senderPk, recipient.id);
    this.realtime.toUserIfOnline(recipient.id, 'chat:message', {
      id: saved.id,
      text: saved.text,
      createdAt: saved.createdAt,
      from: {
        userId: sender.userId,
        name: sender.name,
        avatarId: sender.avatarId,
        image: sender.customProfileImage,
      },
    });
    return saved;
  }

  /**
   * Newest page of a conversation (reversed to chronological for render).
   * Marks the partner's messages as read.
   */
  async listMessages(userPk: number, friendUserId: number) {
    const friend = await this.users.findOneBy({ userId: friendUserId });
    if (!friend) throw new NotFoundException('User not found');
    const rows = await this.messages
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.sender', 'sender')
      .innerJoinAndSelect('m.recipient', 'recipient')
      .where(
        '(sender.id = :me AND recipient.id = :them) OR (sender.id = :them AND recipient.id = :me)',
        { me: userPk, them: friend.id },
      )
      .orderBy('m.createdAt', 'DESC')
      .take(HISTORY_PAGE_SIZE)
      .getMany();
    // Reading the conversation marks their messages to me as read.
    await this.markRead(userPk, friend.id);
    return rows.reverse().map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      mine: m.sender.id === userPk,
      from: {
        userId: m.sender.userId,
        name: m.sender.name,
        avatarId: m.sender.avatarId,
        image: m.sender.customProfileImage,
      },
    }));
  }

  /** Incoming + outgoing pending requests for the requests tab. */
  async listRequests(userPk: number) {
    const rows = await this.friendships
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.requester', 'req')
      .innerJoinAndSelect('f.addressee', 'addr')
      .where('f.status = :status', { status: FriendshipStatus.PENDING })
      .andWhere('(req.id = :me OR addr.id = :me)', { me: userPk })
      .getMany();
    return {
      incoming: rows.filter((f) => f.addressee.id === userPk),
      outgoing: rows.filter((f) => f.requester.id === userPk),
    };
  }

  /** Mark a friend's messages to me as read (chat open / reply). */
  async markReadFrom(userPk: number, friendUserId: number): Promise<void> {
    const friend = await this.users.findOneBy({ userId: friendUserId });
    if (!friend) throw new NotFoundException('User not found');
    await this.markRead(userPk, friend.id);
  }

  private async markRead(mePk: number, themPk: number): Promise<void> {
    await this.messages
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ readAt: new Date() })
      .where(
        '"senderId" = :them AND "recipientId" = :me AND "readAt" IS NULL',
        { me: mePk, them: themPk },
      )
      .execute();
  }
}
