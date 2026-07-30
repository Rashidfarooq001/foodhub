import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';
import { AdminAuthWrapper } from '../components/layout/AdminAuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodHub Admin - Multi-Restaurant Platform Administration',
  description: 'SuperAdmin platform operator dashboard for restaurant approvals, driver onboarding, revenue settlements, and system settings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50/50">
      <body className={`${inter.className} flex min-h-full font-sans antialiased text-gray-900`}>
        <AdminAuthWrapper>
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-x-hidden">
            <AdminHeader />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </AdminAuthWrapper>
      </body>
    </html>
  );
}
