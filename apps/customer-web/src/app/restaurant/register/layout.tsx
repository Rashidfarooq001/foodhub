import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurant Partner Registration | Zayka Food',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RegistrationRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
