import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { HotelAuthWrapper } from '../components/layout/HotelAuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub Hotel & Kitchen Dashboard',
  description: 'Merchant portal for live KDS order management, menu item availability, pricing and revenue analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-950">
      <body className={`${inter.className} flex flex-col min-h-screen w-full font-sans antialiased text-gray-900 bg-gray-950`}>
        <HotelAuthWrapper>{children}</HotelAuthWrapper>
      </body>
    </html>
  );
}
