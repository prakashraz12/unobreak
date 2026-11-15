import Image from 'next/image';
import Logo from '../logo';
import unoBreak from '../../assets/landing/uno-break.png';
import PlayNowButton from './play-now-button';

function Wave() {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-28 w-full"
    >
      <path
        d="M0 66 Q 120 20 240 60 T 480 58 T 720 64 T 960 56 T 1200 66 T 1440 58 L1440 160 L0 160 Z"
        fill="#8fe0f4"
      />
      <path
        d="M0 80 Q 120 36 240 74 T 480 72 T 720 78 T 960 70 T 1200 80 T 1440 72 L1440 160 L0 160 Z"
        fill="#34b6dd"
      />
      <path
        d="M0 92 Q 120 50 240 86 T 480 84 T 720 90 T 960 82 T 1200 92 T 1440 84 L1440 160 L0 160 Z"
        fill="#1f9ecb"
      />
    </svg>
  );
}

export default function LandingHero() {
  return (
    <section className="relative h-[78dvh] w-full overflow-hidden sm:h-dvh">
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,#4a9fec_0%,#78bcf4_60%,#9fd2f8_100%)]"
        aria-hidden="true"
      />

      <img
        src="/hero/hero-bg.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 h-[58%] sm:inset-0 sm:h-auto sm:max-w-screen-2xl sm:mx-auto">
        <Image
          src={unoBreak}
          alt="UnoBreak"
          priority
          fill
          className="size-full object-cover object-bottom sm:object-contain"
        />
      </div>
      <h1 className="sr-only">UnoBreak — Play UNO Online with Friends</h1>

      <div
        className="absolute inset-x-0 bottom-0 h-[300px] bg-linear-to-t from-[#a8d94e] to-transparent"
        aria-hidden="true"
      />

      <Wave />

      <div className="absolute inset-x-0 top-0 z-20 flex h-8 items-center justify-center bg-[#2f6cc0]/95 px-4 shadow-[0_2px_0_rgba(0,0,0,0.25)]">
        <p className="font-display text-[11px] font-black uppercase italic tracking-[0.2em] text-white [text-shadow:0_1.5px_0_rgba(0,0,0,0.4)] sm:text-xs">
          Free to play. No download required. All ages.
        </p>
      </div>

      <header className="absolute inset-x-0 top-8 z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <Logo className="h-auto w-32 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] sm:w-40" />
        <PlayNowButton />
      </header>

      <main className="relative z-10 flex h-full flex-col items-center justify-start gap-5 px-6 pb-0 pt-36 text-center sm:justify-center sm:pt-12">
        <p
          aria-hidden="true"
          className="font-display text-5xl font-black uppercase italic leading-none tracking-tight text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.85)] [-webkit-text-stroke:5px_#000] [paint-order:stroke_fill] sm:text-8xl sm:drop-shadow-[0_8px_0_rgba(0,0,0,0.85)] sm:[-webkit-text-stroke:7px_#000] md:text-8xl"
        >
          It's <br /> <span className="text-[#f5a300]">Uno</span> Break !
        </p>
        <p className="max-w-md text-base font-semibold text-slate-900 drop-shadow-[0_1px_6px_rgba(255,255,255,0.7)] sm:text-lg">
          The fastest way to play UNO online — bots, friends, and real players,
          all in your browser.
        </p>
        <PlayNowButton size="lg" className="mt-4" />
      </main>
    </section>
  );
}
