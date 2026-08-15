'use client';

import React, { useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useAdminStore } from '../../stores/use-admin-store';

export default function AdminSystemSettingsPage() {
  const { platformCommissionRate, setCommissionRate } = useAdminStore();

  const [name, setName] = useState('FoodHub Enterprise Platform');
  const [taxRate, setTaxRate] = useState('5.0');
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [packagingFee, setPackagingFee] = useState('0');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Platform System Settings</h1>
        <p className="text-xs text-gray-500">Configure platform commission rate, GST tax %, base delivery fees & wallet rules</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> System settings updated!
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Platform Brand Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Merchant Commission Rate (%)</label>
            <input
              type="number"
              value={platformCommissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">GST Tax Rate (%)</label>
            <input
              type="text"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Base Delivery Fee (₹)</label>
            <input
              type="text"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Standard Packaging Fee (₹)</label>
            <input
              type="text"
              value={packagingFee}
              onChange={(e) => setPackagingFee(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-purple-700 mt-4"
        >
          <Save className="h-4 w-4" /> Save System Rules
        </button>
      </form>
    </div>
  );
}
