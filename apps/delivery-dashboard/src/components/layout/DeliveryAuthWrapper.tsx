'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { DeliveryLayout } from './DeliveryLayout';
import { useSessionTimeout } from '@foodhub/hooks';
import { getApiBaseUrl } from '@foodhub/config';
import { ZaykaFoodSplash } from './ZaykaFoodSplash';

const API_BASE = getApiBaseUrl();

const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
];

export function DeliveryAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { isAuthenticated, accessToken, logout, updateUser } = useDeliveryAuthStore();

  const isPublicRoute =
    Boolean(pathname) &&
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route),
    );

  useSessionTimeout({
    portalName: 'delivery',
    isAuthenticated,
    accessToken,
    logout,
    apiBaseUrl: API_BASE,
    loginPath: '/login',
    timeoutMs: 5 * 60 * 1000,
  });

  useEffect(() => {
    setMounted(true);
    if (useDeliveryAuthStore.persist?.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useDeliveryAuthStore.persist?.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Hydrate latest Delivery profile from database on mount / auth restore
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !mounted || isPublicRoute) return;
    let alive = true;
    fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.profile) {
          const fullName = `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() || data.name || 'Courier Partner';
          updateUser({
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            name: fullName,
            avatarUrl: data.profile.avatarUrl || undefined,
          });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [isAuthenticated, accessToken, mounted, updateUser, isPublicRoute]);

  // Handle protected route redirection
  useEffect(() => {
    if (mounted && hydrated && !isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [mounted, hydrated, isAuthenticated, isPublicRoute, router]);

  return (
    <>
      {!splashDone && <ZaykaFoodSplash onComplete={() => setSplashDone(true)} />}

      {/* PUBLIC AUTH ROUTES */}
      {isPublicRoute ? (
        <main className="min-h-screen w-full bg-gray-950 flex flex-col flex-1">{children}</main>
      ) : !mounted || !hydrated || !isAuthenticated ? (
        /* INITIAL LOADING / UNAUTHENTICATED SHELL */
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : (
        /* AUTHENTICATED DELIVERY LAYOUT */
        <DeliveryLayout>{children}</DeliveryLayout>
      )}
    </>
  );
}
