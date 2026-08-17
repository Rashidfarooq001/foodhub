'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { HotelLayout } from './HotelLayout';
import { useSessionTimeout } from '@foodhub/hooks';
import { Clock, XCircle, LogOut } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { ZaykaFoodSplash } from '../layout/ZaykaFoodSplash';

const API_BASE = getApiBaseUrl();

const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/partner/register',
  '/register',
];

export function HotelAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { isAuthenticated, user, accessToken, logout, updateUser } = useHotelAuthStore();

  const isPublicRoute =
    Boolean(pathname) &&
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route),
    );

  useSessionTimeout({
    portalName: 'hotel',
    isAuthenticated,
    accessToken,
    logout,
    apiBaseUrl: API_BASE,
    loginPath: '/login',
    timeoutMs: 5 * 60 * 1000,
  });

  const [restaurantStatus, setRestaurantStatus] = useState<string | null>(
    user?.applicationStatus || null,
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(
    user?.rejectionReason || null,
  );

  useEffect(() => {
    setMounted(true);
    if (useHotelAuthStore.persist?.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useHotelAuthStore.persist?.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Hydrate latest Hotel profile from database on mount / auth restore
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !mounted) return;
    let alive = true;
    fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.profile) {
          const fullName = `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim() || data.name || 'Restaurant Owner';
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

  // Fetch latest restaurant approval status when user is authenticated on protected route
  useEffect(() => {
    if (!isAuthenticated || !user || !mounted || isPublicRoute) return;

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/${user.restaurantId || 'my-status'}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.status) {
            setRestaurantStatus(data.status);
            if (data.rejectionReason) setRejectionReason(data.rejectionReason);
          }
        }
      } catch {
        /* fallback to store value */
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, accessToken, mounted, isPublicRoute]);

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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : user?.role === 'RESTAURANT_OWNER' && restaurantStatus === 'PENDING_APPROVAL' ? (
        /* PENDING APPROVAL SCREEN */
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
          <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-10 w-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900">Application Pending Admin Approval</h1>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Your restaurant registration application has been received and is currently under review by ZaykaFood Operations.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="uppercase tracking-wider text-[10px] text-amber-700">Status: PENDING APPROVAL</span>
              </div>
              <p className="text-[11px] text-amber-800 font-normal">
                Full operational features (Kitchen Queue, Menu Management, Orders &amp; Settings) will unlock automatically once an administrator approves your FSSAI &amp; legal documents.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-center">
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="flex items-center gap-2 rounded-2xl bg-gray-100 px-6 py-3 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
                <span>Log Out of Merchant Account</span>
              </button>
            </div>
          </div>
        </div>
      ) : user?.role === 'RESTAURANT_OWNER' && restaurantStatus === 'REJECTED' ? (
        /* REJECTED SCREEN */
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
          <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <XCircle className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900">Application Rejected</h1>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Your restaurant registration application was reviewed and rejected by ZaykaFood Operations.
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-900 space-y-2 text-left">
              <span className="uppercase tracking-wider text-[10px] text-rose-700 block font-black">Rejection Reason</span>
              <p className="text-xs font-semibold text-rose-800 bg-white p-3 rounded-xl border border-rose-200">
                {rejectionReason || 'FSSAI License / PAN Card document verification failed.'}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-center">
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED HOTEL LAYOUT */
        <HotelLayout>{children}</HotelLayout>
      )}
    </>
  );
}
