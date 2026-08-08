'use client';

import React from 'react';
import { Search, Bell, Sliders, LogOut, Menu } from 'lucide-react';
import { useAdminStore } from '../../stores/use-admin-store';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { useRouter } from 'next/navigation';

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
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger & Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-40 sm:w-64 md:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Global search orders, stores..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2 sm:py-2.5 pl-9 sm:pl-10 pr-3 sm:pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Maintenance Mode & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleMaintenanceMode}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl px-2.5 sm:px-4 py-2 text-xs font-bold transition shadow-sm shrink-0 min-h-[40px] ${
            isMaintenanceMode
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <Sliders className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">
            {isMaintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'PLATFORM LIVE (SYSTEM OK)'}
          </span>
          <span className="sm:hidden text-[10px] uppercase">
            {isMaintenanceMode ? 'MAINT' : 'LIVE'}
          </span>
        </button>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
        </button>

        {/* SuperAdmin Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-100 pl-2 sm:pl-4 shrink-0">
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-90 transition focus:outline-none group"
            title="Open Account Settings"
          >
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
              }
              alt={user?.name || 'Admin'}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-purple-600 shadow-sm group-hover:ring-2 group-hover:ring-purple-400"
            />
            <div className="hidden md:block">
              <span className="block text-xs font-bold text-gray-900 truncate max-w-[130px]">
                {user?.name || user?.email || 'Admin User'}
              </span>
              <span className="block text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
