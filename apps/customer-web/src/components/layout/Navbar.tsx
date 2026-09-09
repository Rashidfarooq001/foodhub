'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerHeader } from './PartnerHeader';
import { Search, Utensils, Clock, Bell, Menu } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { getApiBaseUrl } from '@foodhub/config';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, logout, accessToken } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pushAuth = usePushNotifications();

  // Use partner header on partner routes
  if (pathname?.startsWith('/restaurant/register') || pathname?.startsWith('/driver/register')) {
    return <PartnerHeader />;
  }

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8 md:h-[72px] lg:h-[76px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/zaykafood-logo.png"
            alt="ZaykaFood"
            fetchPriority="high"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 max-w-[500px] lg:max-w-[560px] mx-6 md:block">
          <div
            onClick={() => router.push('/search')}
            className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-2 text-sm text-gray-400 hover:border-rose-300 hover:bg-white transition shadow-sm"
          >
            <Search className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="truncate">Search restaurants, dishes and cuisines</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 mr-2">
            <Link
              href="/restaurants"
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-rose-600 transition"
            >
              <Utensils className="h-3.5 w-3.5 text-rose-600" /> Restaurants
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-rose-600 transition"
            >
              <Clock className="h-3.5 w-3.5 text-rose-600" /> Orders
            </Link>
          </div>

          {/* Notification Icon */}
          <button
            onClick={async () => {
              if (isAuthenticated && pushAuth.permission !== 'granted') {
                const url = `${getApiBaseUrl().replace('/customer', '')}/notifications/subscribe`;
                await pushAuth.subscribeToPush(url, accessToken || '');
              }
              router.push('/notifications');
            }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Hamburger Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600 transition"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl z-50">
                <Link
                  href="/coupons"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                >
                  Coupons
                </Link>
                <Link
                  href="/addresses"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                >
                  Your Saved Addresses
                </Link>
                <Link
                  href="/privacy-policy"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                >
                  Privacy Policy
                </Link>
                <div className="my-1 border-t border-gray-100" />
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                  >
                    Login / Sign In
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
