import LandingHero from '../components/landing/hero';
import LandingManifesto from '../components/landing/manifesto';
import LandingWorld from '../components/landing/world';
import LandingFaqs from '../components/landing/faqs';
import LandingFooter from '../components/landing/footer';
import BotDemo from '../components/landing/bot-demo';

export default function Landing() {
  return (
    <div className="w-full">
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
