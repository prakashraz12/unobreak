import Image from 'next/image';
import unoBg from '../../assets/landing/uno-bg.png';

export default function LandingWorld() {
  return (
    <section className="relative w-full bg-[#cdeef9] px-6 pb-16 pt-4 sm:px-10">
      <div className="relative mx-auto max-w-7xl">
        <Image
          src={unoBg}
          alt="The UnoBreak world"
          className="block h-auto w-full"
          placeholder="blur"
          priority={false}
        />

        <div
          className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-b from-transparent to-[#cdeef9]"
          aria-hidden="true"
        />
        <h2 className=" text-center font-display text-4xl font-black uppercase italic leading-[0.95] tracking-wide text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.85)] [-webkit-text-stroke:6px_#000] [paint-order:stroke_fill] sm:text-6xl md:text-7xl">
          An immersive
          <br />
          Uno world
        </h2>
      </div>
    </section>
  );
}
