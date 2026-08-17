import type { Metadata } from 'next';
import './globals.css';
import { HotelAuthWrapper } from '../components/layout/HotelAuthWrapper';

export const metadata: Metadata = {
  title: 'ZaykaFood Restaurant & Kitchen Dashboard',
  description: 'ZaykaFood merchant portal for live KDS order management, menu availability, pricing and revenue analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('foodhub-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen w-full font-sans antialiased text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-950">
        <HotelAuthWrapper>{children}</HotelAuthWrapper>
      </body>
    </html>
  );
}
