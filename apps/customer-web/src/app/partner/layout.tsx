import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner with Zayka Food | Restaurant Onboarding',
  description:
    'Grow your kitchen business by partnering with Zayka Food. Reach thousands of customers across Kashmir with our reliable delivery network and merchant tools.',
  alternates: {
    canonical: 'https://zaykafood.online/partner',
  },
  openGraph: {
    title: 'Partner with Zayka Food | Restaurant Onboarding',
    description:
      'Grow your kitchen business by partnering with Zayka Food. Reach thousands of customers across Kashmir.',
    url: 'https://zaykafood.online/partner',
    siteName: 'Zayka Food',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
