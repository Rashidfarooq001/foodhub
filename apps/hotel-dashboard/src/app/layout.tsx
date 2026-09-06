import type { Metadata } from 'next';
import './globals.css';
import { HotelAuthWrapper } from '../components/layout/HotelAuthWrapper';

export const metadata: Metadata = {
  title: 'ZaykaFood Restaurant & Kitchen Dashboard',
  description:
    'ZaykaFood merchant portal for live KDS order management, menu availability, pricing and revenue analytics.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
      </head>
      <body className="flex flex-col min-h-screen w-full font-sans antialiased text-gray-900 bg-gray-50">
        <HotelAuthWrapper>{children}</HotelAuthWrapper>
      </body>
    </html>
  );
}
