'use client';

import React, { useState } from 'react';
import { Search, Bell, Sliders, LogOut, Menu, X } from 'lucide-react';
import { useAdminStore } from '../../stores/use-admin-store';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@foodhub/config';
import { ThemeToggle } from '../common/ThemeToggle';

interface AdminHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { isMaintenanceMode, toggleMaintenanceMode } = useAdminStore();
  const { user, logout } = useAdminAuthStore();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 md:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-3 sm:px-4 md:px-6 gap-2">
      {/* Mobile Search Overlay */}
      {isSearchExpanded ? (
        <div className="absolute inset-0 z-40 flex items-center bg-white px-3 sm:px-6 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search orders, stores, drivers..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
            />
          </div>
          <button
            onClick={() => setIsSearchExpanded(false)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <>
          {/* Left: Mobile Hamburger & Desktop Search */}
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

            {/* Desktop Search */}
            <div className="hidden md:flex relative w-56 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Global search orders, stores..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="flex md:hidden h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Maintenance Toggle Pill */}
            <button
              onClick={toggleMaintenanceMode}
              className={`flex items-center gap-1 sm:gap-2 rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold transition shadow-sm shrink-0 min-h-[40px] sm:min-h-[44px] ${
                isMaintenanceMode
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
              title="Toggle Platform Maintenance Mode"
            >
              <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden lg:inline">
                {isMaintenanceMode ? 'MAINTENANCE MODE' : 'PLATFORM LIVE'}
              </span>
              <span className="lg:hidden">
                {isMaintenanceMode ? 'MAINT' : 'LIVE'}
              </span>
            </button>

            <ThemeToggle />

            {/* Notification Bell */}
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white dark:ring-gray-900" />
            </button>

            {/* SuperAdmin Profile & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-gray-100 dark:border-gray-800 pl-1.5 sm:pl-3 shrink-0">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 text-left hover:opacity-90 transition focus:outline-none group p-1"
                title="Account Settings"
              >
                <img
                  key={user?.avatarUrl || 'admin-avatar-default'}
                  src={getImageUrl(user?.avatarUrl)}
                  alt={user?.name || 'Admin'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                  }}
                  className="h-9 w-9 rounded-full object-cover border-2 border-purple-600 shadow-sm"
                />

                <div className="hidden xl:block">
                  <span className="block text-xs font-bold text-gray-900 truncate max-w-[110px]">
                    {user?.name || user?.email || 'Admin'}
                  </span>
                  <span className="block text-[9px] text-purple-600 font-bold uppercase tracking-wider">
                    {user?.role || 'SUPER_ADMIN'}
                  </span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                title="Logout"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition shrink-0"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
