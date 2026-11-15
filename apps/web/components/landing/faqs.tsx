const FAQS = [
  {
    q: 'Is UnoBreak free to play?',
    a: 'Yes — completely free. No downloads, no installs. Open your browser and you are at the table.',
  },
  {
    q: 'Can I play with my friends?',
    a: 'Absolutely. Create a custom room, share the invite, and battle your friends — or add them and see when they come online.',
  },
  {
    q: 'What if no players are online?',
    a: 'No problem — smart bots fill the table instantly so you always have a game. Play solo or against the computer anytime.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'UnoBreak runs in any modern browser — phone, tablet, or desktop. Same table, same rules, anywhere.',
  },
  {
    q: 'Do I need an account?',
    a: 'Creating a free account keeps your stats, friends list, and match history — plus it lets real players find you.',
  },
];

export default function LandingFaqs() {
  return (
    <section className="relative w-full bg-[#cdeef9] px-6 pb-20 pt-4 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center font-display text-4xl font-black uppercase italic tracking-wide text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.85)] [-webkit-text-stroke:5px_#000] [paint-order:stroke_fill] sm:text-5xl">
          FAQs
        </h2>
        <div className="flex flex-col gap-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border-4 border-[#2e7d1e] bg-white/90 shadow-[0_4px_0_#2e7d1e,0_8px_14px_rgba(0,0,0,0.2)] transition-colors open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-base font-black uppercase italic tracking-wide text-[#0d3d55] marker:hidden sm:text-lg [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="relative isolate inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border-[3px] border-[#6b2f00] bg-linear-to-b from-[#fff48a] via-[#ffd61f] to-[#f5a300] font-display text-xl font-black italic text-white shadow-[inset_0_-3px_0_#c46a00,inset_0_1px_0_#fff6b0,0_3px_0_#6b2f00] [paint-order:stroke_fill] [text-shadow:0_2px_0_#6b2f00] [-webkit-text-stroke:4px_#6b2f00] transition-transform duration-150 group-active:translate-y-0.5 before:absolute before:inset-x-2 before:top-0.5 before:-z-10 before:h-2/5 before:rounded-lg before:bg-linear-to-b before:from-white/85 before:to-white/0">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:block">×</span>
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm font-bold leading-relaxed text-[#0d3d55]/80 sm:text-base">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
