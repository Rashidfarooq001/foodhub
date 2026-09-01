import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Restaurants – Discover & Order Online | Zayka Food',
  description:
    'Explore verified restaurants, cafes, and cloud kitchens across Kashmir. Browse menus, real ratings, discounts and order online for express delivery with Zayka Food.',
  alternates: {
    canonical: 'https://zaykafood.online/restaurants',
  },
  openGraph: {
    title: 'All Restaurants – Discover & Order Online | Zayka Food',
    description:
      'Explore verified restaurants, cafes, and cloud kitchens across Kashmir. Browse menus, real ratings, discounts and order online with Zayka Food.',
    url: 'https://zaykafood.online/restaurants',
    siteName: 'Zayka Food',
    locale: 'en_IN',
    type: 'website',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://zaykafood.online',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Restaurants',
      item: 'https://zaykafood.online/restaurants',
    },
  ],
};

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
