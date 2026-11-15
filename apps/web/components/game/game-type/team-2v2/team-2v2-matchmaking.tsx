'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket, useSocketEvent } from '@repo/socket';
import { useLoggedInUser } from '../../../../providers/loggedin-user';
import { useFriendRequests } from '../../../../providers/friend-request-provider';
import { usePopUpToaster } from '../../../pop-up-toaster';
import Avatar, { type AvatarConfig } from '../../../avatars/avatar';
import UserAvatar from '../../../avatars/user-avatar';
import { AVATARS } from '../../../avatars/presets';
import MatchmakingScreen from '../../game-ui/matchmaking-screen';
import useSoloMatch from '../solo-player/use-solo-match';
import useInviteCooldown from '../../../../hooks/use-invite-cooldown';

const ACK_TIMEOUT_MS = 10_000;

const WAIT_FOR_PLAYERS_MS = 15_000;

const VS_SPLASH_MS = 2_000;

const Team2v2Matchmaking = ({
  you,
  onBack,
  joinMatchId,
}: {
  you: AvatarConfig;
  onBack: () => void;

  joinMatchId?: number;
}) => {
  const router = useRouter();
  const { user } = useLoggedInUser();
  const { socket } = useSocket();
  const { triggerToast } = usePopUpToaster();
  const { friends } = useFriendRequests();
  const { matchId, opponents, leave, create } = useSoloMatch(
    'TEAM_2V2',
    joinMatchId,

    joinMatchId !== undefined,
  );
  const [invitedIds, setInvitedIds] = useState<ReadonlySet<number>>(new Set());
  const { secondsLeft, startCooldown } = useInviteCooldown();
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [starting, setStarting] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);

  const partner = opponents.find((p) => p.sameTeam);
  const enemies = opponents.filter((p) => !p.sameTeam);

  const finding = searching || deadlineAt !== null;

  useSocketEvent(
    'match:deadline',
    ({
      matchId: id,
      deadlineAt: at,
    }: {
      matchId: number;
      deadlineAt: number;
    }) => {
      if (matchId === null || id === matchId) setDeadlineAt(at);
    },
  );

  useSocketEvent('game:started', ({ sessionId }: { sessionId: number }) => {
    setStarting(sessionId);
  });

  useEffect(() => {
    if (starting === null) return;
    const id = setTimeout(() => router.push(`/play/${starting}`), VS_SPLASH_MS);
    return () => clearTimeout(id);
  }, [starting, router]);

  const invite = async (userId: number) => {
    if (!socket) return;

    const id = matchId ?? (await create());
    if (id === null) {
      triggerToast('Could not create the match', { type: 'error' });
      return;
    }
    try {
      await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('match:invite', { matchId: id, userId });
      setInvitedIds((prev) => new Set(prev).add(userId));
      startCooldown(userId);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Could not invite that player';
      triggerToast(message, { type: 'error' });
    }
  };

  const startSearch = async () => {
    if (!socket || matchId === null) return;
    setSearching(true);
    try {
      await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('match:search', { matchId });
    } catch {
      setSearching(false);
      triggerToast('Could not start the search', { type: 'error' });
    }
  };

  const footer = (
    <div className="flex flex-col items-center gap-3">
      {invitedIds.size > 0 && joinMatchId === undefined && !finding && (
        <button
          type="button"
          onClick={() => void startSearch()}
          className="cursor-pointer rounded-xl border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-8 py-2.5 text-lg font-black uppercase italic tracking-wide text-white shadow-[0_3px_0_#14540f] [-webkit-text-stroke:3px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-105 active:translate-y-0.5"
        >
          Start
        </button>
      )}
      <p className="text-sm font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
        {finding
          ? 'Finding the enemy team — bots fill empty seats.'
          : invitedIds.size > 0
            ? 'Hit Start to search for the enemy team.'
            : 'Tap the + seat to invite a friend.'}
      </p>
    </div>
  );

  return (
    <>
      <MatchmakingScreen
        title="2v2 Teams"
        you={{ ...you, name: user.name, image: user.customProfileImage }}
        bots={AVATARS.filter((a) => a.id !== user.avatarId).slice(0, 3)}
        players={opponents}
        waitMs={WAIT_FOR_PLAYERS_MS}
        deadlineAt={deadlineAt ?? undefined}
        onDone={() => {}}
        onBack={() => {
          leave();
          onBack();
        }}
        footer={footer}

        inviteSlotIndex={partner ? undefined : 1}
        onEmptySlotClick={() => setPickerOpen(true)}

        hideEmptySlots={!finding}
        centered
        showFinding={finding}
        waitStarted={finding}
      />

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
                    const cooling = secondsLeft(f.user.userId);
                    const joined = opponents.some(
                      (p) => p.userId === f.user.userId,
                    );
                    const online = f.user.activity?.isOnline ?? false;

                    const slotTaken =
                      invitedIds.size > 0 || opponents.some((p) => p.sameTeam);
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
                          disabled={
                            cooling > 0 ||
                            joined ||
                            !online ||
                            (slotTaken && !invited)
                          }
                          onClick={() => void invite(f.user.userId)}
                          className="shrink-0 cursor-pointer rounded-lg border-2 border-[#14540f] bg-linear-to-b from-[#7be05a] to-[#2fa52a] px-3 py-1.5 text-[10px] font-black uppercase italic tracking-wide text-white shadow-[0_2px_0_#14540f] [-webkit-text-stroke:2px_#14540f] [paint-order:stroke_fill] transition-transform hover:scale-[1.04] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
                        >
                          {joined
                            ? 'Joined'
                            : cooling > 0
                              ? `Invited ${cooling}s`
                              : invited
                                ? 'Invite again'
                                : 'Invite'}
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
            <motion.div
              className="flex items-center gap-6 sm:gap-10"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <VsTeam
                label="Your Team"
                faces={[
                  {
                    ...(you as AvatarConfig & { image?: string | null }),
                    name: user.name,
                    image: user.customProfileImage,
                  },
                  partner ?? { ...AVATARS[1]!, name: 'Bot' },
                ]}
              />
              <span className="font-display text-4xl font-black italic text-white [-webkit-text-stroke:2px_#6b2f00] drop-shadow-[0_4px_0_rgba(107,47,0,0.9)] sm:text-6xl">
                VS
              </span>
              <VsTeam
                label="Enemy Team"
                faces={[0, 1].map(
                  (i) => enemies[i] ?? { ...AVATARS[2 + i]!, name: 'Bot' },
                )}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const VsTeam = ({
  label,
  faces,
}: {
  label: string;
  faces: (AvatarConfig & { name?: string; image?: string | null })[];
}) => (
  <div className="flex flex-col items-center gap-3">
    <span className="rounded-xl border-2 border-[#6b2f00] bg-linear-to-b from-[#ffd61f] to-[#f5a300] px-4 py-1 text-sm font-black uppercase italic tracking-wide text-white shadow-[0_3px_0_#6b2f00] [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill]">
      {label}
    </span>
    <div className="flex gap-3">
      {faces.map((f, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div
            className="size-16 overflow-hidden rounded-xl border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.35)] sm:size-20"
            style={{ background: f.background }}
          >
            {f.image ? (
              <img
                src={f.image}
                alt={f.name ?? ''}
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            ) : (
              <Avatar
                avatar={f}
                className="size-full! translate-y-[8%] scale-[1.55]"
              />
            )}
          </div>
          <span className="max-w-24 truncate text-xs font-black uppercase tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
            {f.name ?? '???'}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default Team2v2Matchmaking;
