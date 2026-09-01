import React from 'react';

export const DeliverySidebar = () => {
  return (
    <aside className="w-64 border-r bg-slate-900 text-white min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center font-bold">
          D
        </div>
        <span className="font-bold text-lg">Delivery PWA</span>
      </div>
      <nav className="space-y-1 text-sm font-medium text-slate-300">
        <div className="px-3 py-2 rounded-xl bg-emerald-600 text-white">Active Duty Feed</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">
          Live Navigation
        </div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Daily Earnings</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Trip History</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Profile & KYC</div>
      </nav>
    </aside>
  );
};
