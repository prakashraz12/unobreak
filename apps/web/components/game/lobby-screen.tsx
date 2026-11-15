'use client';

import { useRouter } from 'next/navigation';
import CardBase from '../cards/card-base';
import BackButton from '@repo/ui/back-button';
import TextButton from '@repo/ui/text-button';
import WorldFloor from '../floors/world-floor';

interface LobbyScreenProps {
  title: string;

  subtitle?: string;
  onStart: () => void;
}

const LobbyScreen = ({ title, subtitle, onStart }: LobbyScreenProps) => {
  const router = useRouter();

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden">
      <WorldFloor scenery />

      <div className="absolute inset-0 z-10 flex flex-col items-center">
        <BackButton
          onClick={() => router.push('/menu')}
          className="absolute left-[3%] top-[3%]"
        />

        <div className="mt-[5%] flex items-center gap-3">
          <svg
            viewBox="0 0 40 24"
            className="h-8 w-auto drop-shadow-[0_2px_0_rgba(107,47,0,0.9)]"
            aria-hidden="true"
          >
            <circle cx={13} cy={8} r={5} fill="#fff" />
            <path d="M3,22 Q3,14 13,14 Q23,14 23,22 Z" fill="#fff" />
            <circle cx={30} cy={10} r={4} fill="#fff" />
            <path d="M23,22 Q23,16 30,16 Q37,16 37,22 Z" fill="#fff" />
          </svg>
          <h1 className="font-display text-4xl font-black uppercase italic tracking-wide text-white [-webkit-text-stroke:2px_#6b2f00] drop-shadow-[0_3px_0_rgba(107,47,0,0.9)] sm:text-5xl">
            {title}
          </h1>
        </div>

        <div
          className="my-auto [--cw:clamp(120px,17vw,180px)]"
          style={{
            transform: 'perspective(700px) rotateX(42deg) rotateZ(-8deg)',
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
              <CardBase color={null} value={0} faceDown className="w-(--cw)!" />
            </div>
          </div>
        </div>

        <div className="mb-[12%] flex flex-col items-center gap-3">
          <TextButton onClick={onStart} className="min-w-56">
            Start
          </TextButton>
          {subtitle && (
            <span className="text-sm font-black uppercase tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
