'use client';

import { useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import type { Card as EngineCard } from '@repo/game-engine';
import { toCardBaseProps } from '../../../lib/engine-card';
import CardBase from '../../cards/card-base';

export interface ThrowOrigin {
  x: number;
  y: number;
}

const MAX_VISIBLE = 14;

const unit = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hashId = (id: string) => {
  let h = 2166136261;
  for (const ch of id) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const scatterFor = (id: string) => {
  const h = hashId(id);
  return {
    rot: (unit(h) - 0.5) * 72,
    dx: (unit(h ^ 0x9e3779b9) - 0.5) * 0.52,
    dy: (unit(h ^ 0x85ebca6b) - 0.5) * 0.34,
  };
};

const FLIGHT_MS = 0.7;

const ThrownCard = ({
  card,
  origin,
  zIndex,
}: {
  card: EngineCard;
  origin: ThrowOrigin;
  zIndex: number;
}) => {
  const reducedMotion = useReducedMotion();
  const s = scatterFor(card.id);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    const distance = Math.hypot(origin.x, origin.y);
    const peakY = Math.min(origin.y, 0) - Math.min(140, 40 + distance * 0.18);
    const spinZ = (origin.x >= 0 ? -1 : 1) * (45 + Math.abs(s.rot) * 0.5);
    const bankY = origin.x >= 0 ? -22 : 22;
    const split = 0.45;

    gsap.set(el, {
      x: origin.x,
      y: origin.y,
      rotationZ: s.rot + spinZ,
      rotationY: bankY,
      rotationX: -18,
      transformPerspective: 900,
      scale: 1.05,
      opacity: 0,
    });

    const tl = gsap.timeline();
    tl.to(el, { opacity: 1, duration: 0.1 }, 0)
      .to(el, { x: 0, duration: FLIGHT_MS, ease: 'power2.inOut' }, 0)
      .to(
        el,
        {
          y: peakY,
          duration: FLIGHT_MS * split,
          ease: 'power2.out',
        },
        0,
      )
      .to(
        el,
        {
          y: 0,
          duration: FLIGHT_MS * (1 - split),
          ease: 'power2.in',
        },
        FLIGHT_MS * split,
      )
      .to(
        el,
        {
          rotationY: 0,
          duration: FLIGHT_MS,
          ease: 'power1.inOut',
        },
        0,
      )
      .to(
        el,
        {
          rotationX: 0,
          duration: FLIGHT_MS,
          ease: 'power1.inOut',
        },
        0,
      )
      .to(
        el,
        {
          rotationZ: s.rot,
          duration: FLIGHT_MS,
          ease: 'power1.inOut',
        },
        0,
      )
      .to(
        el,
        {
          scale: 1,
          duration: FLIGHT_MS * 0.85,
          ease: 'power1.out',
        },
        0,
      )

      .to(el, { y: 2, duration: 0.06, ease: 'power1.out' }, FLIGHT_MS)
      .to(el, { y: 0, duration: 0.12, ease: 'power2.out' }, FLIGHT_MS + 0.06);

    return () => {
      tl.kill();
    };
  }, [reducedMotion]);

  return (
    <motion.div
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute"
      style={{
        left: `calc(var(--cw) * ${s.dx - 0.5})`,
        top: `calc(var(--cw) * ${s.dy - 0.75})`,
        zIndex,
      }}
    >
      <div ref={ref} className="will-change-transform">
        <CardBase {...toCardBaseProps(card)} flat className="w-(--cw)!" />
      </div>
    </motion.div>
  );
};

interface DiscardStackProps {
  pile: EngineCard[];

  origins: ReadonlyMap<string, ThrowOrigin>;
}

const DiscardStack = ({ pile, origins }: DiscardStackProps) => {
  const visible = pile.slice(-MAX_VISIBLE);

  return (
    <div
      className="absolute left-1/2 top-1/2 size-0"
      style={{
        transform: 'perspective(800px) rotateX(26deg)',
        transformStyle: 'preserve-3d',
      }}
    >
      <AnimatePresence>
        {visible.map((card, i) => (
          <ThrownCard
            key={card.id}
            card={card}
            origin={origins.get(card.id) ?? { x: 0, y: -300 }}
            zIndex={i}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DiscardStack;
