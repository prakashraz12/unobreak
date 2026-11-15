'use client';

import type { ReactNode } from 'react';
import useDevice from '../../hooks/use-device';

const LandscapeGuard = ({ children }: { children: ReactNode }) => {
  const { isMobile, isPortrait } = useDevice();

  return (
    <>
      {children}
      {isMobile && isPortrait && (
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-[#1a0e00]/95 px-8 text-center backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            className="size-20 animate-[rotate-phone_1.6s_ease-in-out_infinite] text-[#ffd61f]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x={7} y={2} width={10} height={20} rx={2.5} />
            <path d="M11 18.5h2" />
          </svg>
          <p className="font-display text-2xl font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:2px_#6b2f00] [paint-order:stroke_fill]">
            Rotate your device
          </p>
          <p className="text-sm font-bold text-white/70">
            This game is best played in landscape mode
          </p>
          <style>{`@keyframes rotate-phone{0%,20%{transform:rotate(0)}55%,80%{transform:rotate(-90deg)}100%{transform:rotate(-90deg)}}`}</style>
        </div>
      )}
    </>
  );
};

export default LandscapeGuard;
