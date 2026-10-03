import type { Metadata } from 'next';
import { Inter, Sora, Outfit, Bricolage_Grotesque, Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ThemeProvider from '../components/ThemeProvider';
import Navbar from '../components/layout/Navbar';
import MainLayout from '../components/layout/MainLayout';
import { FloatingNavDock } from '../components/ui/FloatingNavDock';
import { ViewTransitions } from 'next-view-transitions';
import { AmbientProvider } from '../features/ambient';
import { AmbientDebug } from '../features/ambient/devtools/AmbientDebug';
import { AmbientSync } from '../features/ambient/AmbientSync';
import { featureFlags } from '../lib/featureFlags';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'Kamunati',
  description: 'Production-Grade Sequential Torrent Streaming Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <html lang="en">
        {/* bg-black: pure black base so ambient canvas blends correctly */}
        <body className={`${inter.variable} ${sora.variable} ${outfit.variable} ${bricolage.variable} ${playfair.variable} ${dmSans.variable} ${jetbrains.variable} font-body text-text bg-black`}>
          <AmbientProvider enabled={featureFlags.ambientBackground}>
            <AmbientSync />
            <ThemeProvider>
              <Navbar />
              <MainLayout>{children}</MainLayout>
              <FloatingNavDock />
            </ThemeProvider>
            <AmbientDebug />
          </AmbientProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
