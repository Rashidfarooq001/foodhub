import React from 'react';

export const HotelSidebar = () => {
  return (
    <aside className="w-64 border-r bg-slate-900 text-white min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-8 w-8 rounded-xl bg-[#FF5200] flex items-center justify-center font-bold">
          H
        </div>
        <span className="font-bold text-lg">Hotel Dashboard</span>
      </div>
      <nav className="space-y-1 text-sm font-medium text-slate-300">
        <div className="px-3 py-2 rounded-xl bg-[#FF5200] text-white">Live Kitchen KDS</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Menu Management</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Orders Log</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Earnings & Payouts</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">Store Settings</div>
      </nav>
    </aside>
  );
};
