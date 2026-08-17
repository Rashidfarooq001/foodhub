import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../providers/app-providers';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZaykaFood — Order Food Online | ORDER • DELIVER • ENJOY',
  description: 'ZaykaFood — Fastest food delivery from the finest local restaurants. Order biryani, pizza, burgers, desserts & more. ORDER • DELIVER • ENJOY',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50/50">
      <body className={`${inter.className} flex min-h-full w-full max-w-full overflow-x-hidden flex-col font-sans antialiased text-gray-900`}>
        <AppProviders>
          <Navbar />
          <main className="flex-1 w-full max-w-full min-w-0">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
