import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Food Categories & Cuisines | Zayka Food',
  description:
    'Explore top food categories, cuisines, biryani, pizzas, burgers, traditional Kashmiri wazwan and desserts on Zayka Food across Kashmir.',
  alternates: {
    canonical: 'https://zaykafood.online/categories',
  },
  openGraph: {
    title: 'Food Categories & Cuisines | Zayka Food',
    description:
      'Explore top food categories, cuisines, biryani, pizzas, burgers, traditional Kashmiri wazwan and desserts on Zayka Food across Kashmir.',
    url: 'https://zaykafood.online/categories',
    siteName: 'Zayka Food',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
