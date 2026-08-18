'use client';

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Sliders } from 'lucide-react';
import { useAdminStore } from '../../stores/use-admin-store';

export default function AdminSystemSettingsPage() {
  const { platformCommissionRate, setCommissionRate } = useAdminStore();

  const [name, setName] = useState('ZaykaFood Enterprise Platform');
  const [taxRate, setTaxRate] = useState('5.0');
  const [deliveryFee, setDeliveryFee] = useState('15');
  const [platformFee, setPlatformFee] = useState('3');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Platform System Settings
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Configure default platform commission take-rate, statutory GST %, base delivery &amp; platform convenience fees
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>System configuration parameters updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Platform Brand Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Default Merchant Commission (%)</label>
            <input
              type="number"
              value={platformCommissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Statutory Food GST Rate (%)</label>
            <input
              type="text"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Standard Customer Delivery Fee (₹)</label>
            <input
              type="text"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Platform Convenience Fee (₹)</label>
            <input
              type="text"
              value={platformFee}
              onChange={(e) => setPlatformFee(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 px-6 py-3.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px] mt-2"
        >
          <Save className="h-4 w-4" />
          <span>Save System Parameters</span>
        </button>
      </form>
    </div>
  );
}
