'use client';

import React from 'react';
import { useDutyStore, DutyStatus } from '../../stores/use-duty-store';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { Bell, Wallet, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const DeliveryHeader: React.FC = () => {
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
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md px-6">
      {/* Duty Status Control */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-gray-500">Duty Status:</label>
        <select
          value={dutyStatus}
          onChange={(e) => setDutyStatus(e.target.value as DutyStatus)}
          className={`rounded-2xl border px-3 py-2 text-xs font-black focus:outline-none transition ${getStatusBadge(
            dutyStatus,
          )}`}
        >
          <option value="ONLINE">🟢 ONLINE (Receiving Orders)</option>
          <option value="OFFLINE">⚪ OFFLINE (End Duty)</option>
          <option value="BREAK">🟡 ON BREAK (30m)</option>
          <option value="BUSY">🔴 BUSY (On Active Trip)</option>
        </select>
      </div>

      {/* Wallet Quick Balance & Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span>Wallet</span>
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
        </button>

        {/* Profile & Logout */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            alt="Driver"
            className="h-9 w-9 rounded-full object-cover border-2 border-emerald-500"
          />
          <div className="hidden text-left lg:block">
            <span className="block text-xs font-bold text-gray-900">{user?.name || user?.email || 'Vikram Singh'}</span>
            <span className="block text-[10px] text-emerald-600 font-bold">{user?.role || 'DELIVERY_PARTNER'}</span>
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
