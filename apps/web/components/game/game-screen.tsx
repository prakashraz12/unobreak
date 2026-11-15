'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Card as EngineCard, Color, PlayerView } from '@repo/game-engine';
import type { BotInfo } from '../../hooks/use-local-game';
import { useGame } from '../../context/game-context';
import { toCardBaseProps } from '../../lib/engine-card';
import { useLoggedInUser } from '../../providers/loggedin-user';
import { useNavigationLock } from '../../providers/navigation-guard';
import { AVATARS } from '../avatars/presets';
import SettingsButton from '@repo/ui/settings-button';
import TextButton from '@repo/ui/text-button';
import CardBase, { CARD_COLORS } from '../cards/card-base';
import WorldFloor from '../floors/world-floor';
import ColorPicker from './game-ui/color-picker';
import DiscardStack, {
  scatterFor,
  type ThrowOrigin,
} from './game-ui/discard-stack';
import DrawFlights, { type Seat } from './draw-flights';
import LandscapeGuard from './landscape-guard';
import GameOverModal from './game-over-modal';
import {
  CallUnoButton,
  ChatBubble,
  ChatButton,
  DrawDeck,
  GameTimer,
  PlayerTile,
  PartnerFan,
  SideFan,
  SpeakerButton,
  TopFan,
  TurnPointer,
} from './table-ui';

const QUICK_CHAT = ['Hi!', 'Good luck!', 'Nice move!', 'Oops!', 'UNO!'];
const CHAT_DURATION_MS = 2500;

const DEAL_FAILSAFE_MS = 12000;

const SEAT_INDEX = { you: 0, left: 1, top: 2, right: 3 } as const;

const SEAT_OFFSETS = {
  you: { x: 0, y: 0.55 },
  left: { x: -0.3, y: -0.08 },
  top: { x: 0, y: -0.4 },
  right: { x: 0.3, y: -0.08 },
  deck: { x: -0.2, y: -0.38 },
} as const;

const cardLabel = (card: EngineCard): string => {
  const value =
    card.value === 'draw2'
      ? 'draw two'
      : card.value === 'wild4'
        ? 'wild draw four'
        : card.value;
  return card.color ? `${card.color} ${value}` : value;
};

export interface GameDriver {
  view: PlayerView;
  bots: BotInfo[];
  totalGameTime: number | null;
  turnTimeLimit: number | null;
  turnTimeout: () => void;
  playableCardIds: Set<string>;
  canDraw: boolean;
  canPass: boolean;
  canChallenge: boolean;
  unoCalled: boolean;
  colorPick: { playerId: string; color: Color; key: number } | null;
  play: (cardId: string, chosenColor?: Color) => unknown;
  draw: () => unknown;
  pass: () => unknown;
  challenge: () => unknown;
  callUno: () => void;
  restart: () => unknown;
}

interface GameScreenProps {
  game: GameDriver;
  dealing: boolean;
  setDealing: (v: boolean | ((p: boolean) => boolean)) => void;

  defaultMuted?: boolean;

  hideGameOver?: boolean;
}

const GameScreen = ({
  game,
  dealing,
  setDealing,
  defaultMuted = false,
  hideGameOver = false,
}: GameScreenProps) => {
  const router = useRouter();
  const { user } = useLoggedInUser();
  const { setInGame } = useGame();
  const humanId = String(user.id);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    setInGame(true);
    return () => setInGame(false);
  }, [setInGame]);

  const {
    view,
    bots,
    totalGameTime,
    turnTimeLimit,
    turnTimeout,
    playableCardIds,
    canDraw,
    canPass,
    canChallenge,
    unoCalled,
    colorPick,
    play,
    draw,
    pass,
    challenge,
    callUno,
    restart,
  } = game;

  const [wildCardId, setWildCardId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(totalGameTime ?? 0);
  const [muted, setMuted] = useState(defaultMuted);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  const expired = totalGameTime !== null && secondsLeft <= 0;
  const gameOver = view.status === 'finished' || expired;

  useNavigationLock(!gameOver);

  useEffect(() => {
    if (totalGameTime === null || gameOver || dealing) return;
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [totalGameTime, gameOver, dealing]);

  useEffect(() => {
    if (!chatMessage) return;
    const id = setTimeout(() => setChatMessage(null), CHAT_DURATION_MS);
    return () => clearTimeout(id);
  }, [chatMessage]);

  const [gameCount, setGameCount] = useState(0);
  const [dealtPerSeat, setDealtPerSeat] = useState([0, 0, 0, 0]);

  const [reservedPerSeat, setReservedPerSeat] = useState([0, 0, 0, 0]);

  const [inAirPerSeat, setInAirPerSeat] = useState([0, 0, 0, 0]);
  const expectedDealtRef = useRef(28);
  useEffect(() => {
    if (reducedMotion) {
      setDealing(false);
      return;
    }
    setDealing(true);
    setDealtPerSeat([0, 0, 0, 0]);
    setReservedPerSeat([0, 0, 0, 0]);
    setInAirPerSeat([0, 0, 0, 0]);
    const id = setTimeout(() => setDealing(false), DEAL_FAILSAFE_MS);
    return () => clearTimeout(id);
  }, [gameCount, reducedMotion]);

  const dealtTotal = dealtPerSeat.reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (dealing && dealtTotal >= expectedDealtRef.current) setDealing(false);
  }, [dealtTotal, dealing]);

  const bump = (seat: Seat) => (s: number[]) =>
    s.map((n, j) => (j === SEAT_INDEX[seat] ? n + 1 : n));
  const onDealStart = (seat: Seat) => setReservedPerSeat(bump(seat));
  const onDealt = (seat: Seat) => setDealtPerSeat(bump(seat));
  const onDrawStart = (seat: Seat) => setInAirPerSeat(bump(seat));
  const onDrawLanded = (seat: Seat) =>
    setInAirPerSeat((s) =>
      s.map((n, j) => (j === SEAT_INDEX[seat] ? Math.max(0, n - 1) : n)),
    );

  const [turnLeftMs, setTurnLeftMs] = useState((turnTimeLimit ?? 0) * 1000);
  const timeoutRef = useRef(() => {});
  timeoutRef.current = () => {
    setWildCardId(null);
    turnTimeout();
  };
  useEffect(() => {
    if (turnTimeLimit === null || gameOver || dealing) return;
    const deadline = Date.now() + turnTimeLimit * 1000;
    setTurnLeftMs(turnTimeLimit * 1000);
    const id = setInterval(() => {
      const left = deadline - Date.now();
      setTurnLeftMs(Math.max(0, left));
      if (left <= 0) {
        clearInterval(id);
        timeoutRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [view.currentPlayerId, turnTimeLimit, gameOver, gameCount, dealing]);

  const timerFor = (playerId: string) =>
    turnTimeLimit !== null && !gameOver && view.currentPlayerId === playerId
      ? {
          fraction: turnLeftMs / (turnTimeLimit * 1000),
          seconds: Math.ceil(turnLeftMs / 1000),
        }
      : null;

  const partner = view.partner;
  const seatEntry = (o: { id: string; cardCount: number } | undefined) => {
    const bot = o && bots.find((b) => b.id === o.id);
    return o && bot ? { opponent: o, bot } : null;
  };

  const seatOrder: { id: string; cardCount: number }[] = partner
    ? [
        view.opponents[0],
        { id: partner.id, cardCount: partner.hand.length },
        view.opponents[1],
      ].filter((o): o is { id: string; cardCount: number } => o !== undefined)
    : view.opponents;
  const slotFor: (number | null)[] = partner
    ? [0, 1, 2]
    : seatOrder.length === 1
      ? [null, 0, null]
      : seatOrder.length === 2
        ? [0, null, 1]
        : [0, 1, 2];
  const [leftSeat, topSeat, rightSeat] = slotFor.map((i) =>
    i === null ? null : seatEntry(seatOrder[i]),
  );

  const currentSeat = (() => {
    if (view.currentPlayerId === humanId) return 0;
    if (partner && view.currentPlayerId === partner.id) return 2;
    const i = view.opponents.findIndex((o) => o.id === view.currentPlayerId);
    if (i === -1) return 0;
    return (partner ? i + (i > 0 ? 1 : 0) : slotFor.indexOf(i)) + 1;
  })();

  const [pointer, setPointer] = useState({
    seat: currentSeat,
    angle: currentSeat * 90,
  });
  if (pointer.seat !== currentSeat) {
    const steps = (currentSeat - pointer.seat + 4) % 4;
    const delta = steps === 2 ? 180 * view.direction : steps === 1 ? 90 : -90;
    setPointer({ seat: currentSeat, angle: pointer.angle + delta });
  }

  const humanAvatar =
    AVATARS.find((a) => a.id === user.avatarId) ?? AVATARS[0]!;
  const pendingDraw = view.pendingDraw;

  const mustDraw =
    view.isYourTurn &&
    pendingDraw !== null &&
    !canChallenge &&
    playableCardIds.size === 0;
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    if (!mustDraw || gameOver || dealing) return;
    const id = setTimeout(() => drawRef.current(), 600);
    return () => clearTimeout(id);
  }, [mustDraw, gameOver, dealing]);

  const topCardId = view.discardPile[view.discardPile.length - 1]?.id;
  const pileCentre = topCardId ? scatterFor(topCardId) : { dx: 0, dy: 0 };

  const nameOf = (playerId: string | null | undefined) =>
    playerId === humanId
      ? 'You'
      : (bots.find((b) => b.id === playerId)?.name ?? 'Someone');

  const winnerName = (() => {
    if (view.status === 'finished') {
      if (view.winningTeam !== null) {
        return view.myTeam === view.winningTeam ? 'Your team' : 'Enemy team';
      }
      return nameOf(view.winnerId);
    }
    if (!expired) return null;

    const seats = [
      { id: humanId, count: view.hand.length },
      ...view.opponents.map((o) => ({ id: o.id, count: o.cardCount })),
      ...(view.partner
        ? [{ id: view.partner.id, count: view.partner.hand.length }]
        : []),
    ];
    const winner = seats.reduce((a, b) => (b.count < a.count ? b : a));
    return nameOf(winner.id);
  })();

  const handleCardClick = (card: EngineCard) => {
    if (gameOver || dealing) return;
    if (card.value === 'wild' || card.value === 'wild4') {
      setWildCardId(card.id);
    } else {
      play(card.id);
    }
  };

  const throwCard = (card: EngineCard, el: HTMLElement | null) => {
    const pileEl = pileRef.current;
    if (el && pileEl) {
      const p = pileEl.getBoundingClientRect();
      const c = el.getBoundingClientRect();
      originOverrideRef.current.set(card.id, {
        x: c.left + c.width / 2 - (p.left + p.width / 2),
        y: c.top + c.height / 2 - (p.top + p.height / 2),
      });
    }
    handleCardClick(card);
  };

  const handleRestart = () => {
    restart();
    setDealing(true);
    setSecondsLeft(totalGameTime ?? 0);
    setGameCount((c) => c + 1);
  };

  const seatFor = (seat: {
    bot: { id: string; name: string; avatarId: number; image?: string | null };
  }) => ({
    name: seat.bot.name,
    avatar: AVATARS.find((a) => a.id === seat.bot.avatarId) ?? AVATARS[0]!,
    image: seat.bot.image,
    active: view.currentPlayerId === seat.bot.id && !gameOver,
  });

  const handSize = view.hand.length;

  const slotsFor = (seatIndex: number, cardCount: number) =>
    dealing
      ? Math.min(
          cardCount,
          Math.max(
            reservedPerSeat[seatIndex] ?? 0,
            dealtPerSeat[seatIndex] ?? 0,
          ),
        )
      : cardCount;

  const seatCards = (seatIndex: number, cardCount: number) => {
    const count = slotsFor(seatIndex, cardCount);
    const landed = dealing ? (dealtPerSeat[seatIndex] ?? 0) : Infinity;
    return {
      count,
      hiddenFrom: Math.min(landed, count - (inAirPerSeat[seatIndex] ?? 0)),
    };
  };
  const shownHand = view.hand.slice(0, slotsFor(0, view.hand.length));
  const handHiddenFrom = seatCards(0, view.hand.length).hiddenFrom;
  const handOverlap =
    shownHand.length > 12 ? 0.72 : shownHand.length > 8 ? 0.6 : 0.45;

  const originsRef = useRef(new Map<string, ThrowOrigin>());
  const originOverrideRef = useRef(new Map<string, ThrowOrigin>());

  const thrownRef = useRef(new Set<string>());
  const pileRef = useRef<HTMLDivElement>(null);
  const dealGameRef = useRef(-1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const snapshotRef = useRef<{
    pile: number;
    hand: ReadonlySet<string>;
    counts: ReadonlyMap<string, number>;
  } | null>(null);

  {
    const prev = snapshotRef.current;
    const pile = view.discardPile;
    const appended = prev !== null && pile.length > prev.pile;
    if (prev !== null && pile.length < prev.pile) {
      originsRef.current.clear();
      thrownRef.current.clear();
    }
    const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
    for (let i = appended ? prev.pile : 0; i < pile.length; i++) {
      const card = pile[i]!;
      const override = originOverrideRef.current.get(card.id);
      if (override !== undefined) {
        originOverrideRef.current.delete(card.id);
        originsRef.current.set(card.id, override);
        thrownRef.current.add(card.id);
        continue;
      }
      let seat: { x: number; y: number } = SEAT_OFFSETS.deck;
      if (appended) {
        if (prev.hand.has(card.id)) {
          seat = SEAT_OFFSETS.you;
          thrownRef.current.add(card.id);
        } else {
          const idx = seatOrder.findIndex(
            (o) => o.cardCount < (prev.counts.get(o.id) ?? o.cardCount),
          );
          if (idx === 0) seat = SEAT_OFFSETS.left;
          else if (idx === 1) seat = SEAT_OFFSETS.top;
          else if (idx === 2) seat = SEAT_OFFSETS.right;
        }
      }
      originsRef.current.set(card.id, { x: seat.x * vw, y: seat.y * vh });
    }

    if (prev === null || dealGameRef.current !== gameCount) {
      expectedDealtRef.current =
        view.hand.length + view.opponents.reduce((s, o) => s + o.cardCount, 0);
    }
  }

  useEffect(() => {
    dealGameRef.current = gameCount;
    snapshotRef.current = {
      pile: view.discardPile.length,
      hand: new Set(view.hand.map((c) => c.id)),
      counts: new Map(seatOrder.map((o) => [o.id, o.cardCount])),
    };
  }, [view, gameCount]);

  return (
    <LandscapeGuard>
      <div className="relative h-dvh w-full select-none overflow-hidden">
        <WorldFloor scenery />

        <div className="absolute inset-0 z-10">
          {totalGameTime !== null && (
            <GameTimer
              seconds={secondsLeft}
              className="absolute left-[3%] top-[3%]"
            />
          )}
          <div className="absolute right-[3%] top-[3%] z-30">
            <SettingsButton
              className="size-11!"
              onClick={() => setSettingsOpen((o) => !o)}
            />
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 flex items-center gap-2 rounded-2xl border-2 border-[#2b7fd0] bg-white/95 p-2 shadow-lg">
                <SpeakerButton
                  muted={muted}
                  onToggle={() => setMuted((m) => !m)}
                />
                <span className="whitespace-nowrap pr-2 text-sm font-black text-[#1769d6]">
                  {muted ? 'Sound off' : 'Sound on'}
                </span>
              </div>
            )}
          </div>

          <div data-draw-deck className="absolute left-[30%] top-[10%]">
            <DrawDeck
              count={view.drawPileCount}
              canDraw={canDraw && !mustDraw && !gameOver && !dealing}
              onDraw={draw}
            />
          </div>

          <DrawFlights
            hand={view.hand}
            opponents={seatOrder}
            gameKey={gameCount}
            muted={muted}
            onDealStart={onDealStart}
            onDealt={onDealt}
            onDrawStart={onDrawStart}
            onDrawLanded={onDrawLanded}
          />

          {topSeat && (
            <>
              <PlayerTile
                {...seatFor(topSeat)}
                timer={timerFor(topSeat.bot.id)}
                className="absolute left-[39%] top-[2%] z-10"
              />
              <div
                data-deal-seat="top"
                className="absolute left-[50%] top-[10%]"
              >
                {partner ? (
                  <PartnerFan
                    cards={partner.hand.slice(
                      0,
                      seatCards(2, partner.hand.length).count,
                    )}
                    hiddenFrom={seatCards(2, partner.hand.length).hiddenFrom}
                  />
                ) : (
                  <TopFan {...seatCards(2, topSeat.opponent.cardCount)} />
                )}
              </div>
            </>
          )}

          {leftSeat && (
            <>
              <PlayerTile
                {...seatFor(leftSeat)}
                timer={timerFor(leftSeat.bot.id)}
                className="absolute left-[5%] top-[38%] z-10"
              />
              <div
                data-deal-seat="left"
                className="absolute left-[20%] top-[40%]"
              >
                <SideFan
                  {...seatCards(1, leftSeat.opponent.cardCount)}
                  side="left"
                />
              </div>
            </>
          )}

          {rightSeat && (
            <>
              <PlayerTile
                {...seatFor(rightSeat)}
                timer={timerFor(rightSeat.bot.id)}
                className="absolute right-[5%] top-[38%] z-10"
              />
              <div
                data-deal-seat="right"
                className="absolute right-[20%] top-[40%]"
              >
                <SideFan
                  {...seatCards(3, rightSeat.opponent.cardCount)}
                  side="right"
                />
              </div>
            </>
          )}

          <div
            ref={pileRef}
            className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 [--cw:clamp(60px,8vw,104px)]"
          >
            {!dealing && (
              <TurnPointer
                angle={pointer.angle}
                dx={pileCentre.dx}
                dy={pileCentre.dy}
              />
            )}
            <DiscardStack
              pile={dealing ? [] : view.discardPile}
              origins={originsRef.current}
            />
          </div>

          <div className="absolute left-1/2 top-[64%] flex -translate-x-1/2 flex-col items-center gap-2">
            {view.isYourTurn &&
              !gameOver &&
              !dealing &&
              (pendingDraw || canChallenge || canPass) && (
                <div className="flex items-center gap-2">
                  {pendingDraw && !mustDraw && (
                    <TextButton className="h-9 min-w-24 text-sm" onClick={draw}>
                      Draw {pendingDraw.count}
                    </TextButton>
                  )}
                  {canChallenge && (
                    <TextButton
                      className="h-9 min-w-24 text-sm"
                      onClick={challenge}
                    >
                      Challenge
                    </TextButton>
                  )}
                  {canPass && (
                    <TextButton className="h-9 min-w-24 text-sm" onClick={pass}>
                      Pass
                    </TextButton>
                  )}
                </div>
              )}
          </div>

          <div
            data-deal-seat="you"
            className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-[28%] items-end [--cw:clamp(76px,11vw,150px)]"
          >
            <AnimatePresence>
              {shownHand.map((card, i) => {
                const playable =
                  playableCardIds.has(card.id) && !gameOver && !dealing;
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    layout={!reducedMotion}
                    drag={playable}
                    dragSnapToOrigin
                    dragElastic={0.2}
                    onDragStart={() => setDraggingId(card.id)}
                    onDragEnd={(event, info) => {
                      setDraggingId(null);
                      if (info.offset.y < -80 || info.velocity.y < -500) {
                        throwCard(card, event.currentTarget as HTMLElement);
                      }
                    }}
                    whileDrag={!reducedMotion ? { scale: 1.08 } : undefined}

                    initial={false}
                    animate={{ y: playable ? -18 : 0, opacity: 1 }}
                    exit={
                      reducedMotion
                        ? undefined
                        : thrownRef.current.has(card.id)
                          ? { opacity: 0, transition: { duration: 0.08 } }
                          : { y: -120, opacity: 0 }
                    }
                    whileHover={
                      playable && !reducedMotion ? { y: -34 } : undefined
                    }
                    transition={{ duration: 0.2 }}
                    onTap={() => handleCardClick(card)}
                    disabled={!playable}
                    aria-label={`Play ${cardLabel(card)}`}
                    className={`block shrink-0 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-white disabled:cursor-default ${
                      view.isYourTurn && !playable && !dealing
                        ? 'brightness-75'
                        : ''
                    } ${playable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    data-deal-slot={i}
                    style={{
                      visibility: i >= handHiddenFrom ? 'hidden' : undefined,
                      marginLeft:
                        i === 0 ? 0 : `calc(var(--cw) * -${handOverlap})`,
                      zIndex: draggingId === card.id ? 60 : i,
                      touchAction: playable ? 'none' : undefined,
                    }}
                  >
                    <CardBase
                      {...toCardBaseProps(card)}
                      className="block w-(--cw)! drop-shadow-[-4px_0_6px_rgba(0,0,0,0.3)]!"
                    />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-[4%] left-[16%] z-20">
            <AnimatePresence>
              {chatMessage && (
                <motion.div
                  key={chatMessage}
                  initial={
                    reducedMotion ? false : { scale: 0.6, opacity: 0, y: 10 }
                  }
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-full left-[-40%] mb-3 origin-bottom-left"
                >
                  <ChatBubble
                    text={chatMessage}
                    className="whitespace-nowrap"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <PlayerTile
              name={user.name}
              avatar={humanAvatar}
              image={user.customProfileImage}
              active={view.isYourTurn && !gameOver}
              timer={timerFor(humanId)}
              isYou
            />
            <ChatButton
              onClick={() => setChatOpen((o) => !o)}
              className="absolute -left-14 top-[30%]"
            />
            {chatOpen && (
              <div className="absolute bottom-full left-[-60%] mb-3 flex flex-col gap-1 rounded-2xl border-2 border-[#2b7fd0] bg-white/95 p-2 shadow-lg">
                {QUICK_CHAT.map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => {
                      setChatMessage(msg);
                      setChatOpen(false);
                    }}
                    className="cursor-pointer whitespace-nowrap rounded-xl px-3 py-1 text-left text-sm font-black text-[#1769d6] hover:bg-[#dff1ff]"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            )}
          </div>

          <CallUnoButton
            called={unoCalled}
            onClick={callUno}
            disabled={
              !view.isYourTurn || gameOver || handSize !== 2 || unoCalled
            }
            className="absolute bottom-[4%] right-[10%] z-20"
          />
        </div>

        {wildCardId && (
          <ColorPicker
            onPick={(color) => {
              play(wildCardId, color);
              setWildCardId(null);
            }}
            onCancel={() => {
              originOverrideRef.current.delete(wildCardId);
              setWildCardId(null);
            }}
          />
        )}

        {gameOver && winnerName && !hideGameOver && (
          <GameOverModal
            winnerName={winnerName}
            onRestart={handleRestart}
            onHome={() => router.push('/menu')}
          />
        )}
      </div>
    </LandscapeGuard>
  );
};

export default GameScreen;
