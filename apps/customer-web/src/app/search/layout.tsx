import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Dishes & Restaurants | Zayka Food',
  description:
    'Search for your favorite meals, cuisines, biryani, pizzas, burgers and top restaurants for delivery across Kashmir on Zayka Food.',
  alternates: {
    canonical: 'https://zaykafood.online/search',
  },
  openGraph: {
    title: 'Search Dishes & Restaurants | Zayka Food',
    description:
      'Search for your favorite meals, cuisines, biryani, pizzas, burgers and top restaurants for delivery across Kashmir on Zayka Food.',
    url: 'https://zaykafood.online/search',
    siteName: 'Zayka Food',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
