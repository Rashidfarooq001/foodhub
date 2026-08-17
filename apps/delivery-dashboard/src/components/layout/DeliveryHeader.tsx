'use client';

import React, { useState } from 'react';
import { Bell, Power, Menu, Bike } from 'lucide-react';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { getImageUrl } from '@foodhub/config';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../common/ThemeToggle';

interface DeliveryHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const DeliveryHeader: React.FC<DeliveryHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { user } = useDeliveryAuthStore();
  const [isOnDuty, setIsOnDuty] = useState(true);

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 md:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-3 sm:px-4 md:px-6 gap-2">
      {/* Left: Mobile Hamburger & Driver Info */}
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
          <Bike className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-gray-900 truncate max-w-[200px] lg:max-w-[300px]">
            {user?.name || 'Delivery Partner'}
          </span>
        </div>
      </div>

      {/* Right Controls: On Duty / Off Duty Toggle & Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Prominent Duty Status Toggle */}
        <button
          onClick={() => setIsOnDuty(!isOnDuty)}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl px-3 sm:px-4 py-2 text-xs font-black transition shadow-sm min-h-[44px] ${
            isOnDuty
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
          title="Toggle On/Off Duty Status"
        >
          <Power className={`h-4 w-4 shrink-0 ${isOnDuty ? 'text-emerald-600' : 'text-gray-500'}`} />
          <span>
            {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </span>
          <span className={`h-2 w-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
        </button>

        <ThemeToggle />

        {/* Notifications */}
        <button
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Profile Button */}
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2 rounded-2xl p-1 hover:bg-gray-50 transition shrink-0"
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
            className="h-9 w-9 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
          />
        </button>
      </div>
    </header>
  );
};
