'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket, useSocketEvent } from '@repo/socket';
import { useLoggedInUser } from '../../../../providers/loggedin-user';
import { useFriendRequests } from '../../../../providers/friend-request-provider';
import { usePopUpToaster } from '../../../pop-up-toaster';
import Avatar, { type AvatarConfig } from '../../../avatars/avatar';
import UserAvatar from '../../../avatars/user-avatar';
import AvatarFrame from '../../../avatars/avatar-frame';
import { AVATARS } from '../../../avatars/presets';
import WorldFloor from '../../../floors/world-floor';
import BackButton from '@repo/ui/back-button';
import { NamePill } from '../../game-ui/matchmaking-screen';
import type { Match, User } from '../../../../services/types-schemas';
import useSoloMatch from '../solo-player/use-solo-match';

const ACK_TIMEOUT_MS = 10_000;
const SEATS = 4;

const CustomMatch = ({
  onBack,
  joinMatchId,
  duel = false,
}: {
  you: AvatarConfig;
  onBack: () => void;
  joinMatchId?: number;

  duel?: boolean;
}) => {
  const router = useRouter();
  const { user } = useLoggedInUser();
  const { socket } = useSocket();
  const { triggerToast } = usePopUpToaster();
  const { friends } = useFriendRequests();
  const { matchId, match, start, leave } = useSoloMatch(
    'PRIVATE_ROOM',
    joinMatchId,
  );
  const [invitedIds, setInvitedIds] = useState<ReadonlySet<number>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [starting, setStarting] = useState<number | null>(null);

  const players = useMemo(() => match?.players ?? [], [match]);
  const isHost = players.length > 0 && players[0]!.id === user.id;

  const mode = duel
    ? '1v1'
    : match?.seats == null
      ? 'solo'
      : match.seats.length === 2
        ? '1v1'
        : 'team';
  const teamed = mode === 'team';
  const seatCap = mode === '1v1' ? 2 : SEATS;

  const seatedPlayers = useMemo(() => {
    if (!match?.seats) return null;
    const byPk = new Map(players.map((p) => [p.id, p]));
    const slots = match.seats.map((pk) =>
      pk === null ? null : (byPk.get(pk) ?? null),
    );
    const seated = new Set(players.map((p) => p.id));
    for (const p of players) {
      if (!slots.includes(p)) {
        const i = slots.indexOf(null);
        if (i === -1 || !seated.has(p.id)) break;
        slots[i] = p;
      }
    }
    return slots;
  }, [match, players]);

  const duelPinned = useRef(false);
  useEffect(() => {
    if (!duel || duelPinned.current || !socket || !isHost || matchId === null) {
      return;
    }
    duelPinned.current = true;
    void emit('match:configure', {
      matchId,
      seats: [user.id, players[1]?.id ?? null],
    });
  }, [duel, socket, isHost, matchId]);

  useSocketEvent('game:started', ({ sessionId }: { sessionId: number }) => {
    setStarting(sessionId);
  });

  useEffect(() => {
    if (starting === null) return;
    const id = setTimeout(() => router.push(`/play/${starting}`), 1500);
    return () => clearTimeout(id);
  }, [starting, router]);

  const emit = async (
    event: string,
    body: object,
    fail = 'Something went wrong',
  ) => {
    if (!socket) return undefined;
    try {
      return await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, body);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : fail;
      triggerToast(message, { type: 'error' });
      return undefined;
    }
  };

  const configure = (seats: (number | null)[] | null) =>
    emit('match:configure', { matchId, seats }, 'Could not save seats');

  const setMode = (next: 'solo' | 'team' | '1v1') => {
    if (next === 'solo') return void configure(null);

    const seats: (number | null)[] = Array.from(
      { length: next === '1v1' ? 2 : SEATS },
      (_, i) => players[i]?.id ?? null,
    );
    void configure(seats);
  };

  const movePlayer = (pk: number) => {
    if (!isHost || !match?.seats) return;
    const seats = [...match.seats];
    const from = seats.indexOf(pk);
    if (from === -1) return;

    const target = seats.findIndex((s, i) => i % 2 !== from % 2) ?? -1;
    if (target === -1) return;
    [seats[from], seats[target]] = [seats[target]!, seats[from]!];
    void configure(seats);
  };

  const invite = async (userId: number) => {
    if (!socket || matchId === null) return;
    const ok = await emit(
      'match:invite',
      { matchId, userId },
      'Could not invite that player',
    );
    if (ok !== undefined) {
      setInvitedIds((prev) => new Set(prev).add(userId));
    }
  };

  const go = async () => {
    const sessionId = await start();
    if (sessionId !== null) router.push(`/play/${sessionId}`);
  };

  const inviteTile = (key: string) =>
    players.length < seatCap ? (
      <SeatTile
        key={key}
        onClick={isHost ? () => setPickerOpen(true) : undefined}
      >
        <span className="flex size-full items-center justify-center text-3xl font-black text-white/70">
          +
        </span>
      </SeatTile>
    ) : (
      <span key={key} className="mt-4 flex flex-col items-center">
        <AvatarFrame
          className="size-16 sm:size-20"
          windowClassName="bg-[#2b3a5e]"
        >
          <Avatar
            avatar={AVATARS[1]!}
            className="size-full translate-y-[8%] scale-[1.55] opacity-60"
          />
        </AvatarFrame>
        <NamePill name="Bot" tone="bot" />
      </span>
    );

  const playerTile = (p: User) => (
    <button
      key={p.id}
      type="button"
      onClick={teamed && isHost ? () => movePlayer(p.id) : undefined}
      title={teamed && isHost ? 'Move to the other team' : undefined}
      disabled={!(teamed && isHost)}
      className={`mt-4 flex flex-col items-center ${
        teamed && isHost
          ? 'cursor-pointer transition-transform hover:scale-105'
          : ''
      }`}
    >
      <UserAvatar
        avatarId={p.avatarId}
        image={p.customProfileImage}
        className="size-16 sm:size-20"
      />
      <NamePill
        name={p.id === user.id ? user.name : p.name}
        tone={p.id === user.id ? 'you' : 'bot'}
      />
    </button>
  );

  const teamColumn = (label: string, parity: 0 | 1) => (
    <div className="flex flex-col items-center gap-2">
      <span className="rounded-lg border-2 border-[#6b2f00] bg-linear-to-b from-[#ffd61f] to-[#f5a300] px-3 py-1 text-xs font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#6b2f00] [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill]">
        {label}
      </span>
      <div className="flex gap-12">
        {[0, 1].map((n) => {
          const seat = n * 2 + parity;
          const p = seatedPlayers?.[seat] ?? null;
          return p ? playerTile(p) : inviteTile(`s${seat}`);
        })}
      </div>
    </div>
  );

  const seatRow = (
    <div className="flex items-center gap-12">
      {Array.from({ length: seatCap }, (_, seat) => {
        const p =
          mode === '1v1'
            ? (seatedPlayers?.[seat] ?? players[seat] ?? null)
            : (players[seat] ?? null);
        return (
          <span key={seat} className="flex items-center gap-12">
            {seat > 0 && mode === '1v1' && (
              <span className="font-display text-2xl font-black italic text-white [-webkit-text-stroke:2px_#6b2f00]">
                VS
              </span>
            )}
            {p ? playerTile(p) : inviteTile(`e${seat}`)}
          </span>
        );
      })}
    </div>
  );

  const footer = (
    <div className="flex flex-col items-center gap-3">
      {isHost ? (
        <>
          {!duel && (
            <div className="flex gap-2">
              {(
                [
                  ['Solo', 'solo'],
                  ['Team Up', 'team'],
                  ['1v1', '1v1'],
                ] as const
              ).map(([label, m]) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`cursor-pointer rounded-xl border-2 px-5 py-1.5 text-sm font-black uppercase italic tracking-wide text-white transition-transform hover:scale-105 active:translate-y-0.5 ${
                      active
                        ? 'border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] shadow-[0_3px_0_#14540f] [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill]'
                        : 'border-[#6b2f00] bg-black/30 shadow-[0_3px_0_#6b2f00]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => void go()}
            disabled={mode === '1v1' && players.length < seatCap}
            className="cursor-pointer rounded-xl border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-8 py-2.5 text-lg font-black uppercase italic tracking-wide text-white shadow-[0_3px_0_#14540f] [-webkit-text-stroke:3px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-105 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
          >
            Start
          </button>
          <p className="text-sm font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
            {teamed
              ? 'Tap a player to swap their team — empty seats become bots.'
              : mode === '1v1'
                ? players.length < seatCap
                  ? 'Invite one friend to start the duel.'
                  : 'Ready — start the duel!'
                : 'Tap a + seat to invite a friend — empty seats become bots.'}
          </p>
        </>
      ) : (
        <p className="text-sm font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <WorldFloor />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 px-4">
        <h1 className="font-display text-3xl font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:5px_#6b2f00] [paint-order:stroke_fill] drop-shadow-[0_4px_0_rgba(107,47,0,0.9)]">
          {duel ? '1v1 Duel' : 'Custom Match'}
        </h1>

        {teamed ? (
          <div className="flex items-center gap-6">
            {teamColumn('Team A', 0)}
            <span className="font-display text-2xl font-black italic text-white [-webkit-text-stroke:2px_#6b2f00]">
              VS
            </span>
            {teamColumn('Team B', 1)}
          </div>
        ) : (
          seatRow
        )}

        {footer}

        <BackButton
          onClick={() => {
            leave();
            onBack();
          }}
          className="absolute left-[3%] top-[3%]"
        />
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col overflow-hidden border-l-[3px] border-[#6b2f00] bg-linear-to-b from-[#f0a000] to-[#c46a00] shadow-[-8px_0_24px_rgba(0,0,0,0.5)]"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] px-4 py-3">
                <span className="font-display text-sm font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:3px_#6b2f00] [paint-order:stroke_fill]">
                  Invite a friend
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setPickerOpen(false)}
                  className="cursor-pointer rounded-lg border-2 border-[#6b2f00] bg-black/25 p-1 text-white transition-transform hover:scale-110 active:scale-95"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                {friends.length === 0 ? (
                  <p className="py-6 text-center text-sm font-bold uppercase tracking-wide text-white/70">
                    No friends yet — add some first!
                  </p>
                ) : (
                  friends.map((f) => {
                    const invited = invitedIds.has(f.user.userId);
                    const joined = players.some(
                      (p) => p.userId === f.user.userId,
                    );
                    const online = f.user.activity?.isOnline ?? false;
                    const full = players.length >= seatCap;
                    return (
                      <div
                        key={f.friendshipId}
                        className="flex items-center gap-3 rounded-lg border-2 border-[#6b2f00] bg-[radial-gradient(80%_80%_at_50%_30%,#fff48a_0%,#ffd61f_45%,#f5a300_100%)] px-3 py-2"
                      >
                        <UserAvatar
                          avatarId={f.user.avatarId}
                          image={f.user.customProfileImage}
                          className="size-10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black uppercase italic text-white [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill]">
                            {f.user.name}
                          </p>
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b2f00]/80">
                            <span
                              className={`size-2 rounded-full ${
                                online ? 'bg-[#2fa52a]' : 'bg-[#8a8a8a]'
                              }`}
                            />
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={invited || joined || !online || full}
                          onClick={() => void invite(f.user.userId)}
                          className="shrink-0 cursor-pointer rounded-lg border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-3 py-1.5 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#14540f] [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
                        >
                          {joined ? 'Joined' : invited ? 'Invited' : 'Invite'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {starting !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="font-display text-4xl font-black italic text-white [-webkit-text-stroke:2px_#6b2f00]"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SeatTile = ({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={!onClick}
    className={`relative size-16 overflow-hidden rounded-xl border-[3px] border-white bg-[#2b3a5e] shadow-[0_4px_10px_rgba(0,0,0,0.35)] sm:size-20 ${
      onClick ? 'cursor-pointer transition-transform hover:scale-105' : ''
    }`}
  >
    {children}
  </button>
);

export default CustomMatch;
