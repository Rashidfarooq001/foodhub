import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DeliverySidebar } from '../components/layout/DeliverySidebar';
import { DeliveryHeader } from '../components/layout/DeliveryHeader';
import { DeliveryAuthWrapper } from '../components/layout/DeliveryAuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub Driver & Courier Dashboard',
  description: 'Gig delivery fleet portal for order dispatching, real-time GPS navigation, daily earnings, and courier wallet payouts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50/50">
      <body className={`${inter.className} flex min-h-full font-sans antialiased text-gray-900`}>
        <DeliveryAuthWrapper>
          <DeliverySidebar />
          <div className="flex flex-1 flex-col overflow-x-hidden">
            <DeliveryHeader />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </DeliveryAuthWrapper>
      </body>
    </html>
  );
}
