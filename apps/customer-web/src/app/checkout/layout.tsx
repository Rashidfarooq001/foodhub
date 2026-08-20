import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout & Payment | Zayka Food',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
