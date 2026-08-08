'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { AdminLayout } from './AdminLayout';

import { useSessionTimeout } from '@foodhub/hooks';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
];

export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, accessToken, logout, updateUser } = useAdminAuthStore();

  useSessionTimeout({
    portalName: 'admin',
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

  // Hydrate latest Admin profile from database on mount / auth restore
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !mounted) return;
    let isMounted = true;
    const fetchAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.profile) {
            const fullName = `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() || data.name || 'Super Admin';
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
  }, [isAuthenticated, accessToken, mounted, updateUser]);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(route),
  );

  // PUBLIC AUTH ROUTES: Render page directly WITHOUT AdminLayout / Sidebar / Header
  if (isPublicRoute) {
    return <main className="min-h-screen w-full bg-gray-950 flex flex-col">{children}</main>;
  }

  // Initial Auth Loading State (Clean screen, NO sidebar flash)
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // PROTECTED AUTHENTICATED ROUTES ONLY: Wrap inside AdminLayout (Sidebar + Header)
  return <AdminLayout>{children}</AdminLayout>;
}
