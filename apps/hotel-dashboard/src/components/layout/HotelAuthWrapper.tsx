'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { AuthGuard } from '@foodhub/ui';
import { Clock, XCircle, AlertCircle, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export function HotelAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, accessToken, logout, setAuth } = useHotelAuthStore();
  const [mounted, setMounted] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState<string | null>(
    user?.applicationStatus || null,
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(
    user?.rejectionReason || null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch latest restaurant approval status when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user || !mounted) return;
    if (pathname === '/login' || pathname?.startsWith('/partner/register') || pathname?.startsWith('/register')) return;

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
      } finally {
        if (isMounted) setStatusChecked(true);
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, accessToken, mounted, pathname]);

  if (pathname === '/login' || pathname?.startsWith('/partner/register') || pathname?.startsWith('/register')) {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Application Pending Screen
  if (isAuthenticated && user?.role === 'RESTAURANT_OWNER' && restaurantStatus === 'PENDING_APPROVAL') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
        <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock className="h-10 w-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Application Pending Admin Approval</h1>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your restaurant registration application has been received and is currently under review by FoodHub Operations.
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
    );
  }

  // Application Rejected Screen
  if (isAuthenticated && user?.role === 'RESTAURANT_OWNER' && restaurantStatus === 'REJECTED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
        <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Application Rejected</h1>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your restaurant registration application was reviewed and rejected by FoodHub Operations.
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
    );
  }

  return (
    <AuthGuard
      isAuthenticated={isAuthenticated}
      userRole={user?.role || null}
      allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'RESTAURANT_STAFF', 'SUPER_ADMIN']}
      customerPortalUrl={process.env.NEXT_PUBLIC_CUSTOMER_WEB_URL || 'https://foodhub-customer-web-ten.vercel.app'}
      onUnauthorized={(reason) => {
        if (reason === 'UNAUTHENTICATED') {
          router.push('/login');
        }
      }}
    >
      {children}
    </AuthGuard>
  );
}
