import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '../providers/app-providers';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ea580c',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://zaykafood.online'),
  title: {
    default: 'ZaykaFood — Fast Food Delivery in Kashmir',
    template: '%s | Zayka Food',
  },
  description:
    'Order food online from ZaykaFood. Discover restaurants, biryani, pizza, burgers, desserts and more. Fast food delivery in Kashmir.',
  keywords: [
    'Zayka Food',
    'ZaykaFood',
    'food delivery Kashmir',
    'online food delivery Srinagar',
    'order food online Kashmir',
    'Kashmiri food delivery',
    'wazwan delivery',
    'best restaurants Kashmir',
    'Zayka food online',
  ],
  authors: [{ name: 'Zayka Food', url: 'https://zaykafood.online' }],
  creator: 'Zayka Food',
  publisher: 'Zayka Food',
  applicationName: 'Zayka Food',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: 'https://zaykafood.online',
  },
  openGraph: {
    title: 'Zayka Food – Online Food Delivery in Kashmir',
    description:
      'Order delicious food online with Zayka Food. Discover local restaurants, explore menus, order your favorite meals and get food delivered to your doorstep across Kashmir.',
    url: 'https://zaykafood.online',
    siteName: 'Zayka Food',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://zaykafood.online/icon.png',
        width: 512,
        height: 512,
        alt: 'Zayka Food Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zayka Food – Online Food Delivery in Kashmir',
    description:
      'Order delicious food online with Zayka Food. Discover local restaurants, explore menus, order your favorite meals and get food delivered to your doorstep across Kashmir.',
    images: ['https://zaykafood.online/icon.png'],
    creator: '@zaykafood',
    site: '@zaykafood',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/zaykafood-logo.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  verification: {
    google: 'googlef347593ceeccec2e',
  },
  other: {
    'google-site-verification': 'googlef347593ceeccec2e.html',
  },
  manifest: '/manifest.json',
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Zayka Food',
  url: 'https://zaykafood.online',
  description:
    'Order delicious food online with Zayka Food. Discover local restaurants, explore menus, order your favorite meals and get food delivered to your doorstep across Kashmir.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://zaykafood.online/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zayka Food',
  url: 'https://zaykafood.online',
  logo: 'https://zaykafood.online/icon.png',
  description:
    'Online food delivery platform connecting food lovers with top local restaurants and kitchens across Kashmir.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://zaykafood.online/support',
    availableLanguage: ['English', 'Kashmiri', 'Urdu', 'Hindi'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50/50">
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.className} flex min-h-full w-full max-w-full overflow-x-hidden flex-col font-sans antialiased text-gray-900`}>
        <AppProviders>
          <Navbar />
          <main className="flex-1 w-full max-w-full min-w-0">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
