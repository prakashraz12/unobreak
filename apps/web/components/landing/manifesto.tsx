import Image, { type StaticImageData } from 'next/image';
import classicMode from '../../assets/landing/classicmod.png';
import solo from '../../assets/landing/solo.png';
import withFriends from '../../assets/landing/wiithfriends.png';
import room from '../../assets/landing/room.png';

const SHOWCASE: { src: StaticImageData; alt: string }[] = [
  { src: classicMode, alt: 'Classic mode — play vs computer' },
  { src: solo, alt: 'Solo — match with real players' },
  { src: withFriends, alt: 'Team up with friends' },
  { src: room, alt: 'Custom rooms — your room, your rules' },
];

export default function LandingManifesto() {
  return (
    <section className="relative w-full bg-[linear-gradient(180deg,#1f9ecb_0%,#5ec8ea_45%,#cdeef9_100%)] px-6 pb-24 pt-20 sm:px-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h2 className="font-display text-5xl font-black uppercase italic leading-[0.95] tracking-wide text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.85)] [-webkit-text-stroke:6px_#000] [paint-order:stroke_fill] sm:text-7xl md:text-8xl">
          Your table
          <br />
          Your rules
        </h2>
        <p className="max-w-xl text-base font-bold leading-relaxed text-[#0d3d55] sm:text-lg">
          Battle bots, match real players, team up with friends —<br />
          all from your browser. No downloads required.
        </p>
      </div>

      <div className="mx-auto mt-16 flex max-w-5xl flex-col items-center gap-10">
        {SHOWCASE.map((img) => (
          <div
            key={img.alt}
            className="relative isolate w-full overflow-hidden rounded-3xl border-[6px] border-[#6b2f00] bg-linear-to-b from-[#fff48a] via-[#ffd61f] to-[#f5a300] p-2 shadow-[inset_0_-5px_0_#c46a00,inset_0_2px_0_#fff6b0,0_10px_24px_rgba(0,0,0,0.35)] before:absolute before:inset-x-6 before:top-1 before:-z-10 before:h-8 before:rounded-2xl before:bg-linear-to-b before:from-white/70 before:to-white/0"
          >
            <div className="overflow-hidden rounded-2xl border-4 border-[#6b2f00]">
              <Image
                src={img.src}
                alt={img.alt}
                className="block h-auto w-full"
                placeholder="blur"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
