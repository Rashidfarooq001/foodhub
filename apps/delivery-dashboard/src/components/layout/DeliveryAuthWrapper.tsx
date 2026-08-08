'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { DeliveryLayout } from './DeliveryLayout';

const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
];

export function DeliveryAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useDeliveryAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(route),
  );

  // PUBLIC AUTH ROUTES: Render page directly WITHOUT DeliveryLayout / Sidebar / Header
  if (isPublicRoute) {
    return <main className="min-h-screen w-full bg-gray-950 flex flex-col">{children}</main>;
  }

  // Initial Auth Loading State (Clean screen, NO sidebar flash)
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Protected Route Unauthenticated Guard: Redirect to /login
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // PROTECTED AUTHENTICATED ROUTES ONLY: Wrap inside DeliveryLayout (Sidebar + Header)
  return <DeliveryLayout>{children}</DeliveryLayout>;
}
