'use client';

import React from 'react';
import { useAdminStore } from '../../stores/use-admin-store';
import { Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminFeatureFlagsPage() {
  const { isMaintenanceMode, toggleMaintenanceMode } = useAdminStore();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Feature Flags & System Control</h1>
        <p className="text-xs text-gray-500">Toggle maintenance mode, emergency platform shutdown & experimental features</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
        {/* Maintenance Mode Toggle */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h4 className="text-base font-bold text-gray-900">Platform Maintenance Mode</h4>
            <p className="text-xs text-gray-500">Temporarily pause new order placements across Customer Web & Mobile apps</p>
          </div>
          <button
            onClick={toggleMaintenanceMode}
            className={`h-6 w-11 rounded-full p-1 transition ${
              isMaintenanceMode ? 'bg-rose-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition ${
                isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Emergency Order Dispatch Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-gray-900">Auto Driver Dispatch Engine</h4>
            <p className="text-xs text-gray-500">Automatically assign nearest online driver upon kitchen order ready status</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
            ENABLED
          </span>
        </div>
      </div>
    </div>
  );
}
