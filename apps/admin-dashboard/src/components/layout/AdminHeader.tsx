'use client';

import React from 'react';
import { Search, Bell, Sliders, LogOut } from 'lucide-react';
import { useAdminStore } from '../../stores/use-admin-store';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { useRouter } from 'next/navigation';

export const AdminHeader: React.FC = () => {
  const router = useRouter();
  const { isMaintenanceMode, toggleMaintenanceMode } = useAdminStore();
  const { user, logout } = useAdminAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-6">
      {/* Global Search */}
      <div className="relative w-80">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Global search orders, stores, drivers, customers..."
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none"
        />
      </div>

      {/* Maintenance Mode & Profile */}
      <div className="flex items-center gap-4">
        {/* Maintenance Toggle */}
        <button
          onClick={toggleMaintenanceMode}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition shadow-sm ${
            isMaintenanceMode
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>{isMaintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'PLATFORM LIVE (SYSTEM OK)'}</span>
        </button>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
        </button>

        {/* SuperAdmin Profile & Logout */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
            alt="SuperAdmin"
            className="h-9 w-9 rounded-full object-cover border-2 border-purple-600"
          />
          <div className="hidden text-left lg:block">
            <span className="block text-xs font-bold text-gray-900">{user?.name || user?.email || 'SuperAdmin'}</span>
            <span className="block text-[10px] text-purple-600 font-bold">{user?.role || 'SUPER_ADMIN'}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition ml-2"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
