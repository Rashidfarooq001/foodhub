'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Power, Menu, Store } from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../common/ThemeToggle';

const API_BASE = getApiBaseUrl();

interface HotelHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const HotelHeader: React.FC<HotelHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { user, accessToken } = useHotelAuthStore();
  const [isOpen, setIsOpen] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  const restaurantId = user?.restaurantId;

  // Hydrate initial open/closed status from restaurant record
  useEffect(() => {
    if (!restaurantId || !accessToken) return;
    let isMounted = true;
    fetch(`${API_BASE}/restaurants/${restaurantId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data.isOpen === 'boolean') {
          setIsOpen(data.isOpen);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [restaurantId, accessToken]);

  const toggleStoreStatus = async () => {
    if (!restaurantId || !accessToken || loadingToggle) return;
    setLoadingToggle(true);
    const newStatus = !isOpen;
    try {
      const res = await fetch(`${API_BASE}/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isOpen: newStatus }),
      });
      if (res.ok) {
        setIsOpen(newStatus);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingToggle(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 md:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-3 sm:px-4 md:px-6 gap-2">
      {/* Left: Mobile Hamburger & Store Info */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex lg:hidden items-center shrink-0">
          <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-7 w-auto object-contain" />
        </div>

        <div className="hidden md:flex items-center gap-2 truncate">
          <Store className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="text-xs font-bold text-gray-900 truncate max-w-[200px] lg:max-w-[300px]">
            {user?.restaurantName || (user as any)?.name || 'Merchant Kitchen'}
          </span>
        </div>
      </div>

      {/* Right Controls: Store Status Toggle & Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Prominent Online/Offline Store Toggle */}
        <button
          onClick={toggleStoreStatus}
          disabled={loadingToggle}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl px-3 sm:px-4 py-2 text-xs font-black transition shadow-sm min-h-[44px] ${
            isOpen
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
          }`}
          title="Toggle Store Online/Offline Availability"
        >
          <Power className={`h-4 w-4 shrink-0 ${isOpen ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span>
            {loadingToggle ? 'SAVING...' : isOpen ? 'STORE ONLINE' : 'STORE OFFLINE'}
          </span>
          <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        </button>

        <ThemeToggle />

        {/* Notifications */}
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-orange-600 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Profile Button */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2 rounded-2xl p-1 hover:bg-gray-50 transition shrink-0"
          title="Restaurant Settings"
        >
          <img
            key={user?.avatarUrl || 'hotel-avatar-default'}
            src={getImageUrl(user?.avatarUrl)}
            alt={user?.name || 'Restaurant Owner'}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80';
            }}
            className="h-9 w-9 rounded-full object-cover border-2 border-orange-500 shadow-sm"
          />
        </button>
      </div>
    </header>
  );
};
