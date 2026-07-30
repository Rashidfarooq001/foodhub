import React from 'react';

export const HotelHeader = () => {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-slate-900">Spice Garden Outlet #1</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          🟢 ONLINE
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-right">
          <p className="font-semibold text-slate-900">Rajesh Patel</p>
          <p className="text-slate-500">Merchant Owner</p>
        </div>
      </div>
    </header>
  );
};
