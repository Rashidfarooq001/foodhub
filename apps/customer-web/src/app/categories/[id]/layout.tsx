import React from 'react';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id || '';
  const canonicalUrl = `https://zaykafood.online/categories/${encodeURIComponent(id)}`;

  return {
    title: 'Explore Menu Category | Zayka Food',
    description:
      'Browse and order popular food items, dishes, and kitchen specials on Zayka Food.',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Explore Menu Category | Zayka Food',
      description:
        'Browse and order popular food items, dishes, and kitchen specials on Zayka Food.',
      url: canonicalUrl,
      siteName: 'Zayka Food',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default function CategoryDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
