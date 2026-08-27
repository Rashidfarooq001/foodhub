'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PartnerHeader } from './PartnerHeader';
import {
  Search,
  User,
  LogOut,
  Home,
  Clock,
  ChevronDown,
  Utensils,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Use partner header on partner routes
  if (pathname?.startsWith('/restaurant/register') || pathname?.startsWith('/driver/register')) {
    return <PartnerHeader />;
  }

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    router.push('/login');
  };

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const isHome = pathname === '/';

  return (
    <header className={`sticky top-0 z-30 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md ${isHome ? 'hidden md:block' : ''}`}>
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8 md:h-[72px] lg:h-[76px]">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-8 sm:h-9 w-auto object-contain" />
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
            <Link href="/restaurants" className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-rose-600 transition">
              <Utensils className="h-3.5 w-3.5 text-rose-600" /> Restaurants
            </Link>
            <Link href="/orders" className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-rose-600 transition">
              <Clock className="h-3.5 w-3.5 text-rose-600" /> Orders
            </Link>
          </div>

          {/* Notification Icon */}
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>

          {/* Sign In / Profile Identity */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-1.5 hover:bg-gray-50 transition"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName || 'Profile'}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-700">
                    {initials}
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-bold text-gray-800">{user.firstName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl z-50">
                  <Link href="/" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">
                    <Home className="h-4 w-4" /> Home
                  </Link>
                  <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">
                    <Clock className="h-4 w-4" /> My Orders
                  </Link>
                  <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-2xl border border-gray-200 px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:border-rose-500 hover:text-rose-600 transition">
                Sign In
              </Link>
              <Link href="/signup" className="hidden sm:inline-block rounded-2xl bg-rose-600 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 transition shadow-sm shadow-rose-600/20">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
