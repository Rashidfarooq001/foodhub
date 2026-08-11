'use client';

import React, { useState } from 'react';
import { Bell, Search, Power, LogOut, Menu } from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@foodhub/config';
import { ThemeToggle } from '../common/ThemeToggle';

interface HotelHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const HotelHeader: React.FC<HotelHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useHotelAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger & Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hamburger Menu Toggle for Mobile */}
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Responsive Search Input */}
        <div className="relative w-40 sm:w-64 md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, items..."
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2 sm:py-2.5 pl-9 sm:pl-10 pr-3 sm:pr-4 text-xs font-bold text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Store Status Toggle, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Store Open/Close Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl px-2.5 sm:px-4 py-2 text-xs font-bold transition shadow-sm shrink-0 min-h-[40px] ${
            isOpen
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <Power className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{isOpen ? 'STORE ONLINE (OPEN)' : 'STORE CLOSED'}</span>
          <span className="sm:hidden text-[10px] uppercase">{isOpen ? 'ONLINE' : 'CLOSED'}</span>
        </button>

        <ThemeToggle />

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-600 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-100 pl-2 sm:pl-4 shrink-0">
          <img
            key={user?.avatarUrl || 'hotel-avatar-default'}
            src={getImageUrl(user?.avatarUrl)}
            alt={user?.name || 'Owner'}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
            }}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-orange-500"
          />
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-gray-900 truncate max-w-[120px]">
              {user?.name || user?.email || 'Merchant Owner'}
            </span>
            <span className="block text-[10px] text-orange-600 font-bold">{user?.role || 'RESTAURANT_OWNER'}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
