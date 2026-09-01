'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { AdminLayout } from './AdminLayout';
import { useSessionTimeout } from '@foodhub/hooks';
import { getApiBaseUrl } from '@foodhub/config';
import { ZaykaFoodSplash } from './ZaykaFoodSplash';

const API_BASE = getApiBaseUrl();

const PUBLIC_ROUTES = ['/login', '/forgot-password'];

export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { isAuthenticated, accessToken, logout, updateUser } = useAdminAuthStore();

  const isPublicRoute =
    Boolean(pathname) &&
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));

  useSessionTimeout({
    portalName: 'admin',
    isAuthenticated,
    accessToken,
    logout,
    apiBaseUrl: API_BASE,
    loginPath: '/login',
    timeoutMs: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    setMounted(true);
    if (useAdminAuthStore.persist?.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useAdminAuthStore.persist?.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Hydrate latest Admin profile from database on mount / auth restore
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !mounted || isPublicRoute) return;
    let isMounted = true;
    const fetchAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.profile) {
            const fullName =
              `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() ||
              data.name ||
              'Super Admin';
            updateUser({
              firstName: data.profile.firstName,
              lastName: data.profile.lastName,
              name: fullName,
              avatarUrl: data.profile.avatarUrl || undefined,
            });
          }
        }
      } catch {
        /* fallback to cached state */
      }
    };
    fetchAdminProfile();
    return () => {
      isMounted = false;
    };
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        /* AUTHENTICATED ADMIN LAYOUT */
        <AdminLayout>{children}</AdminLayout>
      )}
    </>
  );
}
