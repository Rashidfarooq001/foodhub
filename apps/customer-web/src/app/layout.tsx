import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../providers/app-providers';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub - Order Food Online From Top Local Restaurants',
  description: 'Fastest food delivery from handpicked restaurants in your city. Order biryani, pizza, burgers, desserts & more on FoodHub.',
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50/50">
      <body className={`${inter.className} flex min-h-full flex-col font-sans antialiased text-gray-900`}>
        <AppProviders>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
        <Script
          src="https://control.msg91.com/app/assets/otp-provider/otp-provider.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
