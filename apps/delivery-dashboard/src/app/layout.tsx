import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DeliveryAuthWrapper } from '../components/layout/DeliveryAuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZaykaFood Delivery Partner Dashboard',
  description:
    'Courier app for order dispatches, live navigation, wallet earnings and payout management.',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('foodhub-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.className} flex flex-col min-h-screen w-full font-sans antialiased text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-950`}
      >
        <DeliveryAuthWrapper>{children}</DeliveryAuthWrapper>
      </body>
    </html>
  );
}
