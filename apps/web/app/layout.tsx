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

export const metadata: Metadata = {
  title: 'UnoBreak',
  description: 'UnoBreak — the classic card game, reimagined',
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
