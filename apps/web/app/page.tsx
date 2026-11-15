import type { Metadata } from 'next';
import LandingHero from '../components/landing/hero';
import LandingManifesto from '../components/landing/manifesto';
import LandingWorld from '../components/landing/world';
import LandingFaqs from '../components/landing/faqs';
import LandingFooter from '../components/landing/footer';
import BotDemo from '../components/landing/bot-demo';

export const metadata: Metadata = {
  title: 'UnoBreak — Play UNO Online with Friends',
  description:
    'Play UNO online free on UnoBreak. Jump into solo matches vs bots, 1v1 duels, 2v2 team battles, or private rooms with friends — right in your browser.',
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'UnoBreak',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  description:
    'The classic card game, reimagined. Play UNO online free: solo vs bots, 1v1 duels, 2v2 teams, or private rooms with friends.',
  genre: ['Card game', 'Multiplayer'],
  gamePlatform: 'Web browser',
  applicationCategory: 'Game',
  operatingSystem: 'Any',
  playMode: ['SinglePlayer', 'MultiPlayer'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function Landing() {
  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingHero />
      <LandingManifesto />
      <LandingWorld />

      <section className="relative w-full bg-[#cdeef9] px-6 pb-20 pt-6 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <BotDemo />
        </div>
      </section>

      <LandingFaqs />
      <LandingFooter />
    </div>
  );
}
