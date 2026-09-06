'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';
import { useRouter } from 'next/navigation';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const API_BASE = getApiBaseUrl();

interface HotelHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const HotelHeader: React.FC<HotelHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { user, accessToken } = useHotelAuthStore();
  const [isOpen, setIsOpen] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);
  
  const pushAuth = usePushNotifications();

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
      const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/online-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isOpen: newStatus }),
      });
      if (res.ok) {
        setIsOpen(newStatus);
        if (newStatus) {
          pushAuth.subscribeToPush(`${API_BASE}/notifications/subscribe`, accessToken);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to update store status. Make sure you are within operating hours.');
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingToggle(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 md:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-1.5 sm:px-4 md:px-6 gap-1 sm:gap-2">
      {/* LEFT GROUP: Menu -> Logo -> Store Online */}
      <div className="flex items-center gap-1 sm:gap-3 min-w-0">
        {/* 1. Hamburger Menu */}
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* 2. ZaykaFood Logo (visible on mobile and desktop) */}
        <div className="flex items-center shrink-0">
          <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-5 sm:h-7 w-auto object-contain" />
        </div>

        {/* 3. STORE ONLINE Status */}
        <button
          onClick={toggleStoreStatus}
          disabled={loadingToggle}
          className={`flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-1 text-[9px] sm:text-xs font-black transition shadow-sm h-7 sm:h-10 shrink-0 ${
            isOpen
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
          }`}
          title="Toggle Store Online/Offline Availability"
        >
          <span>{loadingToggle ? '...' : isOpen ? 'STORE ONLINE' : 'STORE OFFLINE'}</span>
          <span
            className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
          />
        </button>
      </div>

      {/* RIGHT GROUP: Notifications -> Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* 4. Notifications */}
        <button
          className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-600 ring-2 ring-white" />
        </button>

        {/* 5. Restaurant Profile Avatar */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2 rounded-full p-0.5 hover:bg-gray-50 transition shrink-0 ml-0.5"
          title="Restaurant Settings"
        >
          <img
            key={user?.avatarUrl || 'hotel-avatar-default'}
            src={getImageUrl(user?.avatarUrl)}
            alt={user?.restaurantName || 'Restaurant Owner'}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80';
            }}
            className="h-7 w-7 sm:h-9 sm:w-9 rounded-full object-cover border border-orange-500 sm:border-2 shadow-sm"
          />
        </button>
      </div>
    </header>
  );
};
