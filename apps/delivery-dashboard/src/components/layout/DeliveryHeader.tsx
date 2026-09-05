'use client';

import React, { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { getImageUrl, getApiBaseUrl } from '@foodhub/config';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../common/ThemeToggle';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface DeliveryHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const DeliveryHeader: React.FC<DeliveryHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { user, accessToken } = useDeliveryAuthStore();
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const pushAuth = usePushNotifications();

  React.useEffect(() => {
    if (!accessToken) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/delivery/me/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsOnDuty(data.dutyStatus === 'ONLINE' || data.operationalStatus === 'ONLINE');
        }
      } catch {
        /* ignore */
      }
    };
    fetchStatus();
  }, [accessToken]);

  const handleToggle = async () => {
    if (!accessToken || isToggling) return;
    setIsToggling(true);
    const newStatus = !isOnDuty;
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/delivery/duty/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline: newStatus }),
      });
      if (res.ok) {
        setIsOnDuty(newStatus);
        if (newStatus) {
          await pushAuth.subscribeToPush(`${getApiBaseUrl()}/notifications/subscribe`, accessToken);
        }
        window.location.reload();
      }
    } catch {
      /* ignore */
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 md:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-1.5 sm:px-4 md:px-6 gap-1 sm:gap-2">
      {/* LEFT GROUP: Menu -> Logo -> On Duty */}
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

        {/* 3. ON DUTY Status */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl px-1.5 sm:px-3 py-1 text-[9px] sm:text-xs font-black transition shadow-sm h-7 sm:h-10 shrink-0 ${
            isOnDuty
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
          title="Toggle On/Off Duty Status"
        >
          <span>{isToggling ? '...' : isOnDuty ? 'ON DUTY' : 'OFF DUTY'}</span>
          <span
            className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}
          />
        </button>
      </div>

      {/* RIGHT GROUP: Moon -> Notifications -> Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* 4. Theme Toggle */}
        <ThemeToggle className="!h-8 !w-8 sm:!h-10 sm:!w-10 !rounded-xl sm:!rounded-2xl" />

        {/* 5. Notifications */}
        <button
          className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* 6. Rider Profile Avatar */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2 rounded-full p-0.5 hover:bg-gray-50 transition shrink-0 ml-0.5"
          title="Rider Settings"
        >
          <img
            key={user?.avatarUrl || 'delivery-avatar-default'}
            src={getImageUrl(user?.avatarUrl)}
            alt={user?.name || 'Driver'}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
            }}
            className="h-7 w-7 sm:h-9 sm:w-9 rounded-full object-cover border border-emerald-500 sm:border-2 shadow-sm"
          />
        </button>
      </div>
    </header>
  );
};
