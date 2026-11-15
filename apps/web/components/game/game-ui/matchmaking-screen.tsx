'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Avatar, { type AvatarConfig } from '../../avatars/avatar';
import AvatarFrame from '../../avatars/avatar-frame';
import BackButton from '@repo/ui/back-button';
import CardBase from '../../cards/card-base';
import WorldFloor from '../../floors/world-floor';
import { AVATARS } from '../../avatars/presets';
import { useNavigationLock } from '../../../providers/navigation-guard';

const FOUND_DELAYS = [900, 1900, 2900];
const DONE_DELAY = 3700;
const SHUFFLE_MS = 110;

export const TILE_SIZE = 'size-[clamp(56px,9vw,104px)]';
export const TILE_FRAME = `${TILE_SIZE} overflow-hidden rounded-xl border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.35)]`;

export const NamePill = ({
  name,
  tone,
}: {
  name: string;
  tone: 'you' | 'bot' | 'ghost' | 'partner';
}) => (
  <span
    className={`mt-2 inline-flex max-w-36 items-center justify-center gap-1.5 whitespace-normal rounded-xl px-3 py-1 text-center text-sm font-black uppercase leading-tight tracking-wide text-white shadow-[0_2px_0_rgba(0,0,0,0.3)] ${
      tone === 'you'
        ? 'bg-[#e8590c]'
        : tone === 'partner'
          ? 'bg-[#2fa52a]'
          : tone === 'bot'
            ? 'bg-[#1e9fd8]'
            : 'bg-[#5aa7c9]/80'
    }`}
  >
    {name}
  </span>
);

type LobbyFace = AvatarConfig & { image?: string | null };

const FaceImage = ({
  image,
  name,
}: {
  image?: string | null;
  name?: string;
}) =>
  image ? (
    <img
      src={image}
      alt={name ?? ''}
      referrerPolicy="no-referrer"
      className="size-full object-cover"
    />
  ) : null;

const YouTile = ({ you }: { you: LobbyFace }) => (
  <div className="flex flex-col items-center">
    <AvatarFrame
      className={TILE_SIZE}
      windowStyle={{ background: you.background }}
    >
      <FaceImage image={you.image} name={you.name} />
      {!you.image && (
        <Avatar
          avatar={you}
          className="size-full! translate-y-[8%] scale-[1.55]"
        />
      )}
    </AvatarFrame>
    <NamePill name={you.name ?? 'You'} tone="you" />
  </div>
);

const SearchingTile = ({
  settled,
  target,
  partner = false,
}: {
  settled: boolean;
  target: LobbyFace;

  partner?: boolean;
}) => {
  const reducedMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (settled || reducedMotion) return;
    const id = setInterval(() => setTick((t) => t + 1), SHUFFLE_MS);
    return () => clearInterval(id);
  }, [settled, reducedMotion]);

  const shown = settled ? target : AVATARS[tick % AVATARS.length]!;

  return (
    <div className="flex flex-col items-center">
      <AvatarFrame
        className={TILE_SIZE}
        windowStyle={{ background: settled ? target.background : '#7fc4de' }}
      >
        {settled ? (
          <motion.div
            className="size-full"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            {target.image ? (
              <FaceImage image={target.image} name={target.name} />
            ) : (
              <Avatar
                avatar={shown}
                className="size-full! translate-y-[8%] scale-[1.55]"
              />
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={shown.id}
              className="size-full opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
            >
              <Avatar
                avatar={shown}
                className="size-full! translate-y-[8%] scale-[1.55]"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </AvatarFrame>
      <NamePill
        name={settled ? (target.name ?? '???') : '???'}
        tone={settled ? (partner ? 'partner' : 'bot') : 'ghost'}
      />
    </div>
  );
};

const PlusTile = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col items-center">
    <button
      type="button"
      onClick={onClick}
      className={`${TILE_FRAME} flex cursor-pointer items-center justify-center border-dashed border-white/80 bg-black/25 text-white transition-transform hover:scale-105 active:scale-95`}
      aria-label="Invite a friend"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-1/2 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
    <NamePill name="Invite" tone="ghost" />
  </div>
);

interface MatchmakingScreenProps {
  title: string;

  you: LobbyFace;

  bots: AvatarConfig[];

  players?: (LobbyFace & { sameTeam?: boolean })[];

  waitMs?: number;

  deadlineAt?: number;
  onDone: () => void;
  onBack: () => void;

  footer?: ReactNode;

  inviteSlotIndex?: number;
  onEmptySlotClick?: () => void;

  hideEmptySlots?: boolean;

  centered?: boolean;

  showFinding?: boolean;

  waitStarted?: boolean;
}

const MatchmakingScreen = ({
  title,
  you,
  bots,
  players,
  waitMs = 120_000,
  deadlineAt,
  onDone,
  onBack,
  footer,
  inviteSlotIndex,
  onEmptySlotClick,
  hideEmptySlots = false,
  centered = false,
  showFinding = false,
  waitStarted = true,
}: MatchmakingScreenProps) => {
  const reducedMotion = useReducedMotion();
  const [found, setFound] = useState(0);
  const [dotTick, setDotTick] = useState(0);

  const [timedOut, setTimedOut] = useState(false);
  const online = players !== undefined;

  useEffect(() => {
    if (online) return;
    const timers = FOUND_DELAYS.map((d, i) =>
      setTimeout(() => setFound(i + 1), d),
    );
    timers.push(setTimeout(onDone, DONE_DELAY));
    return () => timers.forEach(clearTimeout);
  }, [onDone, online]);

  useNavigationLock(true);

  const fallbackEndRef = useRef(0);
  if (fallbackEndRef.current === 0) {
    fallbackEndRef.current = Date.now() + waitMs;
  }
  const waitUntil = deadlineAt ?? fallbackEndRef.current;

  useEffect(() => {
    if (!online || !waitStarted) return;
    const id = setTimeout(
      () => setTimedOut(true),
      Math.max(0, waitUntil - Date.now()),
    );
    return () => clearTimeout(id);
  }, [online, waitUntil]);

  const [waitLeftMs, setWaitLeftMs] = useState(() =>
    Math.max(0, waitUntil - Date.now()),
  );
  useEffect(() => {
    if (!online) return;
    const id = setInterval(
      () => setWaitLeftMs(Math.max(0, waitUntil - Date.now())),
      1000,
    );
    return () => clearInterval(id);
  }, [online, waitUntil]);
  const waitSeconds = Math.ceil(waitLeftMs / 1000);
  const waitLabel = `${Math.floor(waitSeconds / 60)}:${String(
    waitSeconds % 60,
  ).padStart(2, '0')}`;

  useEffect(() => {
    if (!online || !waitStarted) return;
    const full = players.length >= bots.length;
    if (!full && !timedOut) return;
    const id = setTimeout(onDone, full ? 900 : 1600);
    return () => clearTimeout(id);
  }, [online, players, bots.length, timedOut, onDone]);

  useEffect(() => {
    const id = setInterval(() => setDotTick((t) => t + 1), 450);
    return () => clearInterval(id);
  }, []);

  const slots = [
    { pos: 'left-[8%] top-[56%]' },
    { pos: 'right-[8%] top-[16%]' },
    { pos: 'right-[8%] top-[56%]' },
  ];

  const renderSlot = (bot: LobbyFace, i: number, absolute: boolean) => {
    const player = players?.[i];
    const settled = online ? player !== undefined || timedOut : found > i;
    const isInviteSlot =
      online && !settled && onEmptySlotClick && i === inviteSlotIndex;
    if (online && hideEmptySlots && !settled && !isInviteSlot) {
      return null;
    }
    return (
      <div
        key={bot.id}
        className={absolute ? `absolute ${slots[i]?.pos ?? ''}` : undefined}
      >
        {isInviteSlot ? (
          <PlusTile onClick={onEmptySlotClick} />
        ) : (
          <SearchingTile
            settled={settled}
            target={player ?? bot}
            partner={player?.sameTeam === true}
          />
        )}
      </div>
    );
  };

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden">
      <WorldFloor />

      <div className="absolute inset-0 z-10">
        <div className="absolute left-[3%] top-[3%] flex items-center gap-3">
          <BackButton onClick={onBack} />
          <span className="font-display text-xl font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:1.5px_#6b2f00] drop-shadow-[0_2px_0_rgba(107,47,0,0.9)] sm:text-2xl">
            {title}
          </span>
        </div>

        {online && (!centered || showFinding) && (
          <span className="absolute right-[3%] top-[3%] rounded-xl border-2 border-white/70 bg-black/40 px-3 py-1.5 font-display text-lg font-black italic tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
            {waitLabel}
          </span>
        )}

        {(!centered || showFinding) && (
          <h2 className="absolute left-1/2 top-[16%] -translate-x-1/2 whitespace-nowrap font-display text-2xl font-black italic tracking-wide text-white [-webkit-text-stroke:1.5px_#3d3d3d] drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] sm:text-3xl">
            Finding players
            {reducedMotion ? '…' : '.'.repeat((dotTick % 3) + 1)}
          </h2>
        )}

        {centered ? (
          <div className="absolute left-1/2 top-[22%] flex -translate-x-1/2 items-start gap-6">
            <YouTile you={you} />
            {bots.map((bot, i) => renderSlot(bot, i, false))}
          </div>
        ) : (
          <>
            <div className="absolute left-[8%] top-[16%]">
              <YouTile you={you} />
            </div>

            {bots.map((bot, i) => renderSlot(bot, i, true))}
          </>
        )}

        {!centered && (
          <div
            className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 [--cw:clamp(90px,13vw,140px)]"
            style={{
              transform: 'perspective(700px) rotateX(42deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="relative w-(--cw) drop-shadow-[0_18px_16px_rgba(0,0,0,0.3)]"
              style={{ height: 'calc(var(--cw) * 1.5 + 40px)' }}
            >
              {[5, 4, 3, 2, 1].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 top-0 aspect-2/3 w-(--cw) rounded-xl border border-[#d8d8d8] bg-white"
                  style={{ transform: `translateY(${i * 8}px)` }}
                />
              ))}
              <div className="absolute left-0 top-0">
                <CardBase
                  color={null}
                  value={0}
                  faceDown
                  className="w-(--cw)!"
                />
              </div>
            </div>
          </div>
        )}

        {footer && (
          <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchmakingScreen;
