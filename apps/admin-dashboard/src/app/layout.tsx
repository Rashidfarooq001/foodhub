import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminAuthWrapper } from '../components/layout/AdminAuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub SuperAdmin Control Center',
  description: 'SuperAdmin portal for platform analytics, restaurant onboarding, driver approvals, payouts and system configuration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50/50">
      <body className={`${inter.className} flex min-h-full font-sans antialiased text-gray-900`}>
        <AdminAuthWrapper>{children}</AdminAuthWrapper>
      </body>
    </html>
  );
}
