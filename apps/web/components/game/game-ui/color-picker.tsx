'use client';

import type { Color } from '@repo/game-engine';
import { CARD_COLORS } from '../../cards/card-base';
import type { CardColor } from '../../../constant';

const SIDE_COLORS: Record<CardColor, string> = {
  red: '#8f0a11',
  yellow: '#b8890a',
  green: '#1f7a24',
  blue: '#083a80',
};

const TOP_GLOW: Record<CardColor, string> = {
  red: '#ff6a5e',
  yellow: '#ffe14a',
  green: '#6fdc68',
  blue: '#3f96ff',
};

const Cube = ({
  color,
  className,
  zIndex,
  onPick,
}: {
  color: CardColor;
  className?: string;
  zIndex: number;
  onPick: (color: CardColor) => void;
}) => (
  <button
    type="button"
    aria-label={`Choose ${color}`}
    onClick={() => onPick(color)}
    className={`group absolute size-(--cb) cursor-pointer outline-none transition-transform duration-150 hover:-translate-y-2 focus-visible:-translate-y-2 active:translate-y-0.5 ${className ?? ''}`}
    style={{ zIndex }}
  >
    <div
      className="absolute inset-0 translate-y-3 rotate-45 rounded-xl"
      style={{ background: SIDE_COLORS[color] }}
    />

    <div
      className="absolute inset-0 rotate-45 rounded-xl border-2 border-white/30 transition-shadow duration-150 group-hover:shadow-[0_0_24px_rgba(255,255,255,0.6)]"
      style={{
        background: `linear-gradient(135deg, ${TOP_GLOW[color]} 0%, ${CARD_COLORS[color]} 55%)`,
      }}
    />
  </button>
);

interface ColorPickerProps {
  onPick: (color: Color) => void;
  onCancel: () => void;
}

const ColorPicker = ({ onPick, onCancel }: ColorPickerProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    onClick={onCancel}
    role="presentation"
  >
    <div
      className="flex flex-col items-center gap-8"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Choose a color"
    >
      <p className="font-display text-xl font-black uppercase text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
        Pick a color
      </p>
      <div className="relative size-[calc(var(--cb)*3.1)] [--cb:clamp(56px,8vw,88px)]">
        <div className="absolute left-1/2 top-1/2 h-[48%] w-[90%] -translate-x-1/2 translate-y-[-38%] rounded-full border-[6px] border-[#9fe8ff] opacity-60 blur-[2px]" />
        <Cube
          color="green"
          zIndex={0}
          onPick={onPick}
          className="left-1/2 top-0 -translate-x-1/2"
        />
        <Cube
          color="blue"
          zIndex={1}
          onPick={onPick}
          className="left-0 top-1/2 -translate-y-1/2"
        />
        <Cube
          color="yellow"
          zIndex={1}
          onPick={onPick}
          className="right-0 top-1/2 -translate-y-1/2"
        />
        <Cube
          color="red"
          zIndex={2}
          onPick={onPick}
          className="bottom-0 left-1/2 -translate-x-1/2"
        />
      </div>
    </div>
  </div>
);

export default ColorPicker;
