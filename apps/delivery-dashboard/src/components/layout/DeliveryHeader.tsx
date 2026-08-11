'use client';

import React from 'react';
import { useDutyStore, DutyStatus } from '../../stores/use-duty-store';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { Bell, Wallet, LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../common/ThemeToggle';

import { getImageUrl } from '@foodhub/config';

interface DeliveryHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const DeliveryHeader: React.FC<DeliveryHeaderProps> = ({ onOpenMobileMenu }) => {
  const router = useRouter();
  const { dutyStatus, setDutyStatus } = useDutyStore();
  const { user, logout } = useDeliveryAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStatusBadge = (status: DutyStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'BREAK':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BUSY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger & Duty Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <select
          value={dutyStatus}
          onChange={(e) => setDutyStatus(e.target.value as DutyStatus)}
          className={`rounded-2xl border px-2.5 sm:px-3 py-2 text-xs font-black focus:outline-none transition min-h-[40px] ${getStatusBadge(
            dutyStatus,
          )}`}
        >
          <option value="ONLINE">🟢 ONLINE</option>
          <option value="OFFLINE">⚪ OFFLINE</option>
          <option value="BREAK">🟡 BREAK</option>
          <option value="BUSY">🔴 BUSY</option>
        </select>
      </div>

      {/* Right: Wallet Quick Balance & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
          <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Wallet</span>
        </div>

        <ThemeToggle />

        <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-100 pl-2 sm:pl-4 shrink-0">
          <img
            src={getImageUrl(user?.avatarUrl)}
            alt={user?.name || 'Driver'}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
            }}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-emerald-500"
          />
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-gray-900 truncate max-w-[120px]">
              {user?.name || user?.email || 'Courier Partner'}
            </span>
            <span className="block text-[10px] text-emerald-600 font-bold">{user?.role || 'DELIVERY_PARTNER'}</span>
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
