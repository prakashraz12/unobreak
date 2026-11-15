import type { Metadata } from 'next';
import { Baloo_2, Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import PopUpToasterProvider from '../components/pop-up-toaster';
import GameProvider from '../context/game-context';
import QueryClientProvider from '../providers/query-client';
import AuthProvider from '../providers/auth-provider';
import AppProvider from '../providers/app-provider';
import SheetProvider from '../providers/sheet-provider';
import ModalProvider from '../providers/modal-provider';
import NavigationGuardProvider from '../providers/navigation-guard';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});
const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo-2',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'UnoBreak — Play UNO Online with Friends',
    template: '%s | UnoBreak',
  },
  description:
    'UnoBreak — the classic card game, reimagined. Play UNO online free: solo vs bots, 1v1 duels, 2v2 teams, or private rooms with friends. No download required.',
  keywords: [
    'UNO online',
    'play UNO',
    'UNO multiplayer',
    'UNO with friends',
    'card game online',
    'UnoBreak',
    '1v1 UNO',
    '2v2 UNO',
  ],
  applicationName: 'UnoBreak',
  authors: [{ name: 'Prakash Shrestha' }],
  creator: 'Prakash Shrestha',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'UnoBreak',
    title: 'UnoBreak — Play UNO Online with Friends',
    description:
      'The classic card game, reimagined. Play UNO online free: solo vs bots, 1v1 duels, 2v2 teams, or private rooms with friends.',
    images: [
      {
        url: '/hero/your-room-your-rules.jpg',
        width: 1200,
        height: 630,
        alt: 'UnoBreak — play UNO online with friends',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnoBreak — Play UNO Online with Friends',
    description:
      'The classic card game, reimagined. Play UNO online free: solo vs bots, 1v1 duels, 2v2 teams, or private rooms with friends.',
    images: ['/hero/your-room-your-rules.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${baloo2.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <QueryClientProvider>
          <PopUpToasterProvider>
            <AppProvider>
              <GameProvider>
                <AuthProvider>
                  <SheetProvider>
                    <ModalProvider>
                      <NavigationGuardProvider>
                        {children}
                      </NavigationGuardProvider>
                    </ModalProvider>
                  </SheetProvider>
                </AuthProvider>
              </GameProvider>
            </AppProvider>
          </PopUpToasterProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
