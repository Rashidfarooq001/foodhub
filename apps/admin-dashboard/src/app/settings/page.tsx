'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Calculator, Server, Store, Bike, Users, Shield, ArrowRight } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface CombinedSettingsForm {
  platformBrandTitle: string;
  restaurantCommissionPercent: number | '';
  foodGstRate: number | '';
  minimumCustomerDeliveryFee: number | '';
  customerDeliveryPerKm: number | '';
  platformFee: number | '';
  riderBasePay: number | '';
  riderPerKmPay: number | '';
}

export default function CombinedSettingsPage() {
  const [form, setForm] = useState<CombinedSettingsForm>({
    platformBrandTitle: 'ZaykaFood',
    restaurantCommissionPercent: 13,
    foodGstRate: 5,
    minimumCustomerDeliveryFee: 15,
    customerDeliveryPerKm: 5,
    platformFee: 3,
    riderBasePay: 25,
    riderPerKmPay: 6,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Economics Simulator State
  const [simSubtotal, setSimSubtotal] = useState(400);
  const [simDistanceKm, setSimDistanceKm] = useState(5);
  const [simResults, setSimResults] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    runSimulator();
  }, [simSubtotal, simDistanceKm, successMsg]);

  const fetchSettings = async () => {
    try {
      const res = await adminFetch('/pricing/config');
      if (res.ok) {
        const data = await res.json();
        setForm({
          platformBrandTitle: data.platformBrandTitle || 'ZaykaFood',
          restaurantCommissionPercent: data.restaurantCommissionPercent ?? 13,
          foodGstRate: data.foodGstRate ?? 5,
          minimumCustomerDeliveryFee: data.minimumCustomerDeliveryFee ?? 15,
          customerDeliveryPerKm: data.customerDeliveryPerKm ?? 5,
          platformFee: data.platformFee ?? 3,
          riderBasePay: data.riderBasePay ?? 25,
          riderPerKmPay: data.riderPerKmPay ?? 6,
        });
      }
    } catch (err) {
      setErrorMsg('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        platformBrandTitle: form.platformBrandTitle,
        restaurantCommissionPercent: Number(form.restaurantCommissionPercent),
        foodGstRate: Number(form.foodGstRate),
        minimumCustomerDeliveryFee: Number(form.minimumCustomerDeliveryFee),
        customerDeliveryPerKm: Number(form.customerDeliveryPerKm),
        platformFee: Number(form.platformFee),
        riderBasePay: Number(form.riderBasePay),
        riderPerKmPay: Number(form.riderPerKmPay),
      };

      const res = await adminFetch('/pricing/config', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg('Settings saved successfully.');
        await fetchSettings();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMsg('Network error while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const runSimulator = async () => {
    setSimulating(true);
    try {
      const res = await adminFetch('/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify({
          foodSubtotal: simSubtotal,
          distanceKm: simDistanceKm,
          tipAmount: 20
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data);
      }
    } catch (e) {} finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-orange-600" />
            Platform Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Global configuration and single source of truth for platform pricing and unit economics.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4 text-sm font-bold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <form id="settings-form" onSubmit={handleSave} className="space-y-6">
            
            {/* A. GENERAL PLATFORM */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <Server className="h-5 w-5 text-gray-500" />
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">A. General Platform</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Platform Brand Title</label>
                  <input
                    type="text"
                    value={form.platformBrandTitle}
                    onChange={e => setForm({...form, platformBrandTitle: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* B. RESTAURANT / MERCHANT PRICING */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-600" />
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">B. Restaurant / Merchant</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Global Default Commission (%)</label>
                  <input
                    type="number"
                    value={form.restaurantCommissionPercent}
                    onChange={e => setForm({...form, restaurantCommissionPercent: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* C. CUSTOMER FEES */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">C. Customer Fees & Taxes</h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Base Delivery Fee (,1)</label>
                  <input
                    type="number"
                    value={form.minimumCustomerDeliveryFee}
                    onChange={e => setForm({...form, minimumCustomerDeliveryFee: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Extra Delivery Fee (,1/km)</label>
                  <input
                    type="number"
                    value={form.customerDeliveryPerKm}
                    onChange={e => setForm({...form, customerDeliveryPerKm: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Platform Convenience Fee (,1)</label>
                  <input
                    type="number"
                    value={form.platformFee}
                    onChange={e => setForm({...form, platformFee: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Statutory Food GST Rate (%)</label>
                  <input
                    type="number"
                    value={form.foodGstRate}
                    onChange={e => setForm({...form, foodGstRate: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* D. COURIER / RIDER PAYOUT */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <Bike className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">D. Courier / Rider Payout</h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Rider Base Payout (,1)</label>
                  <input
                    type="number"
                    value={form.riderBasePay}
                    onChange={e => setForm({...form, riderBasePay: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Rider Distance Pay (,1/km)</label>
                  <input
                    type="number"
                    value={form.riderPerKmPay}
                    onChange={e => setForm({...form, riderPerKmPay: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* E. LIVE ECONOMICS SIMULATOR */}
        <div className="lg:col-span-5 space-y-6">
          <button
            type="submit"
            form="settings-form"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/30 transition disabled:opacity-50"
          >
            {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-5 w-5" />}
            <span>Save & Publish Configuration</span>
          </button>

          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10 overflow-hidden">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 border-b border-purple-200 dark:border-purple-900/50 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Live Economics Simulator</h2>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Test Food Subtotal</label>
                    <span className="text-xs font-black text-purple-700 dark:text-purple-400">,1{simSubtotal}</span>
                  </div>
                  <input type="range" min="100" max="2000" step="50" value={simSubtotal} onChange={e => setSimSubtotal(Number(e.target.value))} className="w-full accent-purple-600" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Delivery Distance</label>
                    <span className="text-xs font-black text-purple-700 dark:text-purple-400">{simDistanceKm} km</span>
                  </div>
                  <input type="range" min="1" max="15" step="1" value={simDistanceKm} onChange={e => setSimDistanceKm(Number(e.target.value))} className="w-full accent-purple-600" />
                </div>
              </div>

              {simResults ? (
                <div className="rounded-xl bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/30 p-4 text-xs space-y-2">
                  <div className="flex justify-between"><span>Food Subtotal:</span> <span className="font-bold">,1{simResults.foodSubtotal}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee:</span> <span className="font-bold">,1{simResults.customerDeliveryFee}</span></div>
                  <div className="flex justify-between"><span>Platform Fee:</span> <span className="font-bold">,1{simResults.platformFee}</span></div>
                  <div className="flex justify-between"><span>GST:</span> <span className="font-bold">,1{simResults.taxes}</span></div>
                  <div className="flex justify-between"><span>Tip (Simulated):</span> <span className="font-bold">,120</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-sm font-black text-emerald-600 dark:text-emerald-400">
                    <span>Customer Grand Total:</span> <span>,1{simResults.customerTotal}</span>
                  </div>

                  <div className="flex justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"><span>Merchant Commission:</span> <span className="font-bold text-red-500">-,1{simResults.restaurantCommission}</span></div>
                  <div className="flex justify-between"><span>Merchant Net Settlement:</span> <span className="font-bold text-blue-600">,1{simResults.restaurantSettlement}</span></div>

                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700"><span>Courier Partner Payout:</span> <span className="font-bold">,1{simResults.totalRiderPayout}</span></div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm font-black text-purple-600 dark:text-purple-400">
                    <span>ZaykaFood Contribution Margin:</span> <span>,1{simResults.platformContributionMargin}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-gray-500 py-4">Calculating simulator results...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
