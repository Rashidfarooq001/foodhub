import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { HotelSidebar } from '../components/layout/HotelSidebar';
import { HotelHeader } from '../components/layout/HotelHeader';
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
    <html lang="en" className="h-full bg-gray-50/50">
      <body className={`${inter.className} flex min-h-full font-sans antialiased text-gray-900`}>
        <HotelAuthWrapper>
          <HotelSidebar />
          <div className="flex flex-1 flex-col overflow-x-hidden">
            <HotelHeader />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </HotelAuthWrapper>
      </body>
    </html>
  );
}
