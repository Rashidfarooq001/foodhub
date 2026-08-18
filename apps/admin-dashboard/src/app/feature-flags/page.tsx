'use client';

import React from 'react';
import { useAdminStore } from '../../stores/use-admin-store';
import { Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminFeatureFlagsPage() {
  const { isMaintenanceMode, toggleMaintenanceMode } = useAdminStore();

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Feature Flags &amp; System Control
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Toggle platform maintenance mode, automated courier dispatch &amp; experimental flags
        </p>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        {/* Maintenance Mode Toggle */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-gray-900">Platform Maintenance Mode</h4>
            <p className="text-[11px] text-gray-500">Temporarily pause new order placements across Customer Web &amp; Mobile apps</p>
          </div>
          <button
            onClick={toggleMaintenanceMode}
            className={`h-7 w-12 rounded-full p-1 transition shrink-0 min-h-[44px] flex items-center ${
              isMaintenanceMode ? 'bg-rose-600 justify-end' : 'bg-gray-300 justify-start'
            }`}
            aria-label="Toggle Maintenance Mode"
          >
            <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* Auto Dispatch Flag */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-gray-900">Automated Courier Dispatch Engine</h4>
            <p className="text-[11px] text-gray-500">Automatically broadcast orders to nearest online delivery partners</p>
          </div>
          <span className="flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800 uppercase shrink-0">
            <CheckCircle2 className="h-3 w-3" />
            Enabled
          </span>
        </div>
      </div>
    </div>
  );
}
