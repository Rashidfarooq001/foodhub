'use client';

import React from 'react';
import { Bell, Sliders, LogOut, Menu } from 'lucide-react';
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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-[56px] w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-[16px] sm:px-6 gap-[6px] min-w-0">
      {/* Left: Mobile Hamburger & Desktop Search */}
      <div className="flex items-center gap-[6px] sm:gap-4 shrink-0 mr-1">
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-[40px] w-[40px] items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex lg:hidden items-center shrink-0">
          <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-[24px] w-auto object-contain" />
        </div>
      </div>

      {/* Right Controls - Horizontally scrollable */}
      <div className="flex flex-1 items-center justify-end gap-[6px] overflow-x-auto min-w-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center gap-[6px] shrink-0 px-1">
          
          {/* Maintenance Toggle Pill */}
          <button
            onClick={toggleMaintenanceMode}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-bold transition shrink-0 h-[40px] snap-start ${
              isMaintenanceMode
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
            title="Toggle Platform Maintenance Mode"
          >
            <Sliders className="h-[14px] w-[14px] shrink-0" />
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
            className="relative flex h-[40px] w-[40px] items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0 snap-start"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white dark:ring-gray-900" />
          </button>

          {/* SuperAdmin Profile & Logout */}
          <div className="flex items-center gap-[6px] border-l border-gray-200 dark:border-gray-800 pl-[6px] shrink-0">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 text-left hover:opacity-90 transition focus:outline-none shrink-0"
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
                className="h-[42px] w-[42px] rounded-full object-cover border border-purple-600 shrink-0 snap-start"
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
              className="flex h-[40px] w-[40px] items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition shrink-0 snap-start"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
