import Link from 'next/link';
import WorldFloor from '../floors/world-floor';

const LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/contact', label: 'Contact' },
];

export default function LandingFooter() {
  return (
    <footer className="relative h-[500px] w-full overflow-hidden bg-[#cdeef9]">
      <div className="absolute inset-x-0 bottom-0 h-full">
        <WorldFloor scenery water={false} skyline={false} />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-6 sm:px-10">
        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <nav className="flex items-center gap-5">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-black uppercase tracking-wide text-[#0d3d55] transition-opacity hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-[11px] font-bold text-[#0d3d55]/90">
            © {new Date().getFullYear()} UnoBreak. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
