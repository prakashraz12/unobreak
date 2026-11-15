'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Card as EngineCard } from '@repo/game-engine';
import { playSound } from '../../assets/export';
import { toCardBaseProps } from '../../lib/engine-card';
import CardBase from '../cards/card-base';
import DealerMachine3D, {
  DEALER_HANDOFF_S,
  dealerSlotOnScreen,
} from './game-ui/dealer-machine-3d';

gsap.registerPlugin(useGSAP);

export type Seat = 'you' | 'left' | 'top' | 'right';
const OPPONENT_SEATS = (count: number): Seat[] =>
  count === 1
    ? ['top']
    : count === 2
      ? ['left', 'right']
      : ['left', 'top', 'right'];

const DECK_POS = { x: 0.33, y: 0.16 } as const;

const DEAL_ORIGIN = { x: 0.5, y: 0.48 } as const;

const DEAL_STAGGER_S = 0.3;

const FLY_S = 0.62;

const DRAW_STAGGER_S = 0.28;

const DECK_LAUNCH = { scale: 1, rotX: 38, rotZ: -18, at: 0 } as const;
const TARGET: Record<Seat, { x: number; y: number; scale: number }> = {
  you: { x: 0.5, y: 0.88, scale: 1.7 },
  left: { x: 0.25, y: 0.29, scale: 0.85 },
  top: { x: 0.53, y: 0.14, scale: 0.7 },
  right: { x: 0.75, y: 0.29, scale: 0.85 },
};

interface FlightTarget {
  x: number;
  y: number;
  scale: number;
}

const handSlotTarget = (slot: number, handSize: number): FlightTarget => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cw = Math.min(Math.max(76, vw * 0.11), 150);
  const overlap = handSize > 12 ? 0.72 : handSize > 8 ? 0.6 : 0.45;
  const width = cw * (1 + (handSize - 1) * (1 - overlap));
  const flightCw = Math.min(Math.max(44, vw * 0.06), 80);
  return {
    x: (vw / 2 - width / 2 + slot * cw * (1 - overlap) + cw / 2) / vw,

    y: (vh - 0.22 * 1.5 * cw) / vh,
    scale: cw / flightCw,
  };
};

interface Flight {
  id: string;
  seat: Seat;

  card: EngineCard | null;

  index: number;

  stagger: number;

  target?: FlightTarget;

  origin?: { x: number; y: number };

  slot: number;

  launch: { scale: number; rotX: number; rotZ: number; at: number };

  dealer?: {
    x: number;
    y: number;
    rot: number;

    behind: boolean;
  };
}

const dealerSize = () => Math.min(Math.max(340, window.innerWidth * 0.38), 520);
const flightCw = () => Math.min(Math.max(44, window.innerWidth * 0.06), 80);

const measureSlot = (seat: Seat, slot: number) => {
  const root = document.querySelector(`[data-deal-seat="${seat}"]`);
  const cards = root?.querySelectorAll<HTMLElement>('[data-deal-slot]');
  const el = cards?.[Math.min(slot, cards.length - 1)];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
    scale: (el.offsetWidth * Number(el.dataset.scale ?? 1)) / flightCw(),
    rotZ: Number(el.dataset.rotZ ?? 0),
    rotY: Number(el.dataset.rotY ?? 0),
  };
};

const deckCentre = () => {
  const el = document.querySelector('[data-draw-deck]');
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
};

const seatAnchor = (seat: Seat) => {
  const el = document.querySelector(`[data-deal-seat="${seat}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
};
const aimAt = (o: { x: number; y: number }, t: { x: number; y: number }) =>
  (Math.atan2(
    (t.x - o.x) * window.innerWidth,
    (t.y - o.y) * window.innerHeight,
  ) *
    180) /
  Math.PI;

const FlightCard = ({
  flight,
  onStarted,
  onDone,
}: {
  flight: Flight;
  onStarted: (flight: Flight) => void;
  onDone: (flight: Flight) => void;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useGSAP(
    (_context, contextSafe) => {
      const el = rootRef.current;
      const flip = flipRef.current;
      if (!el || !flip) return;
      const lift = liftRef.current;
      const shadow = shadowRef.current;
      if (!el || !flip || !lift || !shadow) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const origin = flight.origin ?? DECK_POS;
      const { launch } = flight;

      const flips = flight.card ? 3 : 4;

      gsap.set(el, {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: launch.scale,
        autoAlpha: 0,
      });
      gsap.set(flip, {
        rotationX: launch.rotX,
        rotationY: 0,
        rotationZ: launch.rotZ,
        transformPerspective: 700,
      });
      gsap.set(lift, { y: 0, scale: 1 });
      gsap.set(shadow, { xPercent: -50, yPercent: -50, opacity: 0 });

      gsap
        .timeline({
          delay: flight.index * flight.stagger,
          onStart: () => onStarted(flight),
        })
        .add(
          contextSafe!(() => {
            const fallback = flight.target ?? TARGET[flight.seat];
            const end = measureSlot(flight.seat, flight.slot) ?? {
              ...fallback,
              rotZ: 0,
              rotY: 0,
            };
            toss((end.x - origin.x) * vw, (end.y - origin.y) * vh, end);
          }),
          launch.at,
        );

      function toss(
        dx: number,
        dy: number,
        end: FlightTarget & { rotZ: number; rotY: number },
      ) {
        if (!el || !flip || !lift || !shadow) return;
        const D = FLY_S;
        const hop = Math.min((Math.hypot(dx, dy) || 1) * 0.35, vh * 0.16);
        gsap
          .timeline({ onComplete: () => doneRef.current(flight) })
          .set(el, { autoAlpha: 1 })
          .addLabel('fly')
          .to(
            el,
            {
              x: dx,
              y: dy,
              scale: end.scale,
              duration: D,
              ease: 'power1.inOut',
            },
            'fly',
          )
          .to(
            lift,
            { y: -hop, scale: 1.18, duration: D / 2, ease: 'power2.out' },
            'fly',
          )
          .to(
            lift,
            { y: 0, scale: 1, duration: D / 2, ease: 'power2.in' },
            `fly+=${D / 2}`,
          )
          .to(
            flip,
            {
              rotationX: 0,
              rotationY: flips * 180 + end.rotY,
              rotationZ: end.rotZ,
              duration: D,
              ease: 'power1.inOut',
            },
            'fly',
          )
          .fromTo(
            shadow,
            { opacity: 0.45, scale: 1 },
            { opacity: 0.15, scale: 0.55, duration: D / 2, ease: 'power2.out' },
            'fly',
          )

          .to(
            shadow,
            { opacity: 0, scale: 0.9, duration: D / 2, ease: 'power2.in' },
            `fly+=${D / 2}`,
          );
      }
    },
    { scope: rootRef },
  );

  const cardClass = `block w-(--cw)! ${
    flight.seat === 'you' ? 'drop-shadow-[-4px_0_6px_rgba(0,0,0,0.3)]!' : ''
  }`;

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none absolute [--cw:clamp(44px,6vw,80px)] ${
        flight.dealer?.behind ? 'z-20' : 'z-40'
      }`}
      style={{
        left: `${(flight.origin ?? DECK_POS).x * 100}%`,
        top: `${(flight.origin ?? DECK_POS).y * 100}%`,
        visibility: 'hidden',
      }}
    >
      <div
        ref={shadowRef}
        className="absolute left-1/2 top-[80%] h-[calc(var(--cw)*0.4)] w-(--cw) rounded-[50%] bg-black blur-[5px]"
        style={{ opacity: 0 }}
      />
      <div ref={liftRef}>
        <div
          ref={flipRef}
          className="relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}>
            <CardBase color={null} value={0} faceDown className={cardClass} />
          </div>
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {flight.card ? (
              <CardBase
                {...toCardBaseProps(flight.card)}
                className={cardClass}
              />
            ) : (
              <CardBase color={null} value={0} faceDown className={cardClass} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DrawFlightsProps {
  hand: EngineCard[];
  opponents: ReadonlyArray<{ id: string; cardCount: number }>;

  gameKey: number;
  muted: boolean;

  onDealStart?: (seat: Seat) => void;

  onDealt?: (seat: Seat) => void;

  onDrawStart?: (seat: Seat) => void;

  onDrawLanded?: (seat: Seat) => void;
}

const DrawFlights = ({
  hand,
  opponents,
  gameKey,
  muted,
  onDealStart,
  onDealt,
  onDrawStart,
  onDrawLanded,
}: DrawFlightsProps) => {
  const reducedMotion = useReducedMotion();
  const [flights, setFlights] = useState<Flight[]>([]);

  const [dealer, setDealer] = useState<{
    x: number;
    y: number;
    rot: number;
  } | null>(null);

  const [pulse, setPulse] = useState(0);
  const prevRef = useRef<{
    hand: ReadonlySet<string>;
    counts: ReadonlyMap<string, number>;
    gameKey: number;
  } | null>(null);

  const remove = useCallback(
    (flight: Flight) => {
      setFlights((f) => f.filter((x) => x.id !== flight.id));
      if (flight.dealer) onDealt?.(flight.seat);
      else onDrawLanded?.(flight.seat);
    },
    [onDealt, onDrawLanded],
  );

  const onStarted = useCallback(
    (flight: Flight) => {
      if (!flight.dealer) return;
      const { x, y, rot } = flight.dealer;
      setDealer({ x, y, rot });
      onDealStart?.(flight.seat);
      setPulse((p) => p + 1);
    },
    [onDealStart],
  );

  useLayoutEffect(() => {
    const prev = prevRef.current;
    prevRef.current = {
      hand: new Set(hand.map((c) => c.id)),
      counts: new Map(opponents.map((o) => [o.id, o.cardCount])),
      gameKey,
    };
    if (reducedMotion) return;

    if (!prev || prev.gameKey !== gameKey) {
      const seats: { seat: Seat; cards: (EngineCard | null)[] }[] = [
        { seat: 'you', cards: hand },
        ...opponents.map((o, i) => ({
          seat: OPPONENT_SEATS(opponents.length)[i]!,
          cards: Array<EngineCard | null>(o.cardCount).fill(null),
        })),
      ];
      const rounds = Math.max(...seats.map((s) => s.cards.length));
      const deal: Flight[] = [];
      for (let r = 0; r < rounds; r++) {
        for (const { seat, cards } of seats) {
          const card = cards[r];
          if (card !== undefined) {
            const target =
              seat === 'you' ? handSlotTarget(r, r + 1) : TARGET[seat];

            const rot = aimAt(DEAL_ORIGIN, seatAnchor(seat) ?? target);
            const slot = dealerSlotOnScreen(rot, dealerSize());
            deal.push({
              id: `deal-${seat}-${r}`,
              seat,
              card,
              index: deal.length,
              stagger: DEAL_STAGGER_S,
              target,
              slot: r,

              origin: {
                x: DEAL_ORIGIN.x + slot.x / window.innerWidth,
                y: DEAL_ORIGIN.y + slot.y / window.innerHeight,
              },
              launch: {
                scale: slot.width / flightCw(),
                rotX: 62,
                rotZ: 0,
                at: DEALER_HANDOFF_S,
              },
              dealer: { ...DEAL_ORIGIN, rot, behind: slot.behind },
            });
          }
        }
      }
      setFlights(deal);
      return;
    }

    const next: Flight[] = [];

    const deck = deckCentre();
    const added = hand.filter((c) => !prev.hand.has(c.id));
    added.forEach((card, i) => {
      const slot = hand.length - added.length + i;
      next.push({
        id: `draw-you-${card.id}`,
        seat: 'you',
        card,
        index: i,
        stagger: DRAW_STAGGER_S,
        target: handSlotTarget(slot, hand.length),
        slot,
        origin: deck,
        launch: DECK_LAUNCH,
      });
    });
    opponents.forEach((o, i) => {
      const gained = o.cardCount - (prev.counts.get(o.id) ?? o.cardCount);
      for (let k = 0; k < gained; k++) {
        next.push({
          id: `draw-${o.id}-${o.cardCount}-${k}`,
          seat: OPPONENT_SEATS(opponents.length)[i]!,
          card: null,
          index: added.length + k,
          stagger: DRAW_STAGGER_S,
          slot: o.cardCount - gained + k,
          origin: deck,
          launch: DECK_LAUNCH,
        });
      }
    });
    if (next.length) {
      next.forEach((f) => onDrawStart?.(f.seat));
      setFlights((f) => [...f, ...next]);
      if (!muted) playSound('cardPull');
    }
  }, [hand, opponents, gameKey, muted, reducedMotion]);

  return (
    <>
      <AnimatePresence>
        {dealer && flights.some((f) => f.dealer) && (
          <motion.div
            key="dealer"
            className="pointer-events-none absolute z-30"
            style={{
              left: `${dealer.x * 100}%`,
              top: `${dealer.y * 100}%`,
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <DealerMachine3D
              aim={dealer.rot}
              pulse={pulse}
              className="aspect-square w-[clamp(340px,38vw,520px)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          onStarted={onStarted}
          onDone={remove}
        />
      ))}
    </>
  );
};

export default DrawFlights;
