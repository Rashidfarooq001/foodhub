import React from 'react';

export const AdminSidebar = () => {
  return (
    <aside className="w-64 border-r bg-slate-950 text-white min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-8 w-8 rounded-xl bg-orange-600 flex items-center justify-center font-bold">
          A
        </div>
        <span className="font-bold text-lg">Admin Center</span>
      </div>
      <nav className="space-y-1 text-sm font-medium text-slate-300">
        <div className="px-3 py-2 rounded-xl bg-orange-600 text-white">Command Overview</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">Merchant Onboarding</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">Driver Fleet KYC</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">Order Support Override</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">Financial Payouts</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">Promos & Surge Matrix</div>
        <div className="px-3 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">System Settings</div>
      </nav>
    </aside>
  );
};
