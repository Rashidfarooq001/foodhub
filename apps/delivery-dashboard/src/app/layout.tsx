import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DeliveryAuthWrapper } from '../components/layout/DeliveryAuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub Delivery Partner Dashboard',
  description: 'Courier app for order dispatches, live navigation, wallet earnings and payout management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-950">
      <body className={`${inter.className} flex flex-col min-h-screen w-full font-sans antialiased text-gray-900 bg-gray-950`}>
        <DeliveryAuthWrapper>{children}</DeliveryAuthWrapper>
      </body>
    </html>
  );
}
