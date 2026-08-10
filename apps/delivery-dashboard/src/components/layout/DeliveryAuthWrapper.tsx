'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { DeliveryLayout } from './DeliveryLayout';

import { useSessionTimeout } from '@foodhub/hooks';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
];

export function DeliveryAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, accessToken, logout, updateUser } = useDeliveryAuthStore();

  useSessionTimeout({
    portalName: 'delivery',
    isAuthenticated,
    accessToken,
    logout,
    apiBaseUrl: API_BASE,
    loginPath: '/login',
    timeoutMs: 5 * 60 * 1000,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate latest Delivery profile (incl. avatarUrl) from database on mount / auth restore
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !mounted) return;
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
  }, [isAuthenticated, accessToken, mounted, updateUser]);

  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => currentPath === route || currentPath.startsWith(route),
  );

  // PUBLIC AUTH ROUTES: Render page directly WITHOUT DeliveryLayout / Sidebar / Header / Loading Shell
  if (isPublicRoute) {
    return <main className="min-h-screen w-full bg-gray-950 flex flex-col flex-1">{children}</main>;
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
