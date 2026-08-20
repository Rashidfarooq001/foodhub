import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Support & Help Center | Zayka Food',
  description:
    'Need help with your food order, delivery status, refund or account? Contact Zayka Food customer support anytime for assistance across Kashmir.',
  alternates: {
    canonical: 'https://zaykafood.online/support',
  },
  openGraph: {
    title: 'Customer Support & Help Center | Zayka Food',
    description:
      'Need help with your food order, delivery status, refund or account? Contact Zayka Food customer support.',
    url: 'https://zaykafood.online/support',
    siteName: 'Zayka Food',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
