'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Percent,
  TrendingUp,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  Bike,
  ShieldAlert,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { adminFetch } from '../../utils/admin-fetch';

const API_BASE = getApiBaseUrl();

interface PricingConfigForm {
  restaurantCommissionPercent: number;
  customerDeliveryPerKm: number;
  minimumCustomerDeliveryFee: number;
  platformFee: number;
  smallOrderThreshold: number;
  smallOrderFee: number;
  riderBasePay: number;
  riderPerKmPay: number;
  riderWaitingPay: number;
  riderPeakBonus: number;
  riderLongDistanceBonus: number;
  riderBatchBonus: number;
}

const DEFAULT_FORM: PricingConfigForm = {
  restaurantCommissionPercent: 13,
  customerDeliveryPerKm: 7,
  minimumCustomerDeliveryFee: 25,
  platformFee: 10,
  smallOrderThreshold: 199,
  smallOrderFee: 10,
  riderBasePay: 30,
  riderPerKmPay: 7,
  riderWaitingPay: 0,
  riderPeakBonus: 0,
  riderLongDistanceBonus: 0,
  riderBatchBonus: 0,
};

export default function AdminPricingConfigPage() {
  const [form, setForm] = useState<PricingConfigForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Unit Economics Simulator state
  const [simSubtotal, setSimSubtotal] = useState<number>(400);
  const [simDistanceKm, setSimDistanceKm] = useState<number>(5);
  const [simTip, setSimTip] = useState<number>(20);

  useEffect(() => {
    fetchPricingConfig();
  }, []);

  const fetchPricingConfig = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminFetch('/pricing/config');
      if (res.ok) {
        const data = await res.json();
        setForm({
          restaurantCommissionPercent: Number(data.restaurantCommissionPercent ?? 13),
          customerDeliveryPerKm: Number(data.customerDeliveryPerKm ?? 7),
          minimumCustomerDeliveryFee: Number(data.minimumCustomerDeliveryFee ?? 25),
          platformFee: Number(data.platformFee ?? 10),
          smallOrderThreshold: Number(data.smallOrderThreshold ?? 199),
          smallOrderFee: Number(data.smallOrderFee ?? 10),
          riderBasePay: Number(data.riderBasePay ?? 30),
          riderPerKmPay: Number(data.riderPerKmPay ?? 7),
          riderWaitingPay: Number(data.riderWaitingPay ?? 0),
          riderPeakBonus: Number(data.riderPeakBonus ?? 0),
          riderLongDistanceBonus: Number(data.riderLongDistanceBonus ?? 0),
          riderBatchBonus: Number(data.riderBatchBonus ?? 0),
        });
      }
    } catch {
      setErrorMsg('Failed to load active pricing config from backend. Showing defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminFetch('/pricing/config', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update pricing configuration');
      }

      setSuccessMsg('Platform pricing & unit economics engine configuration saved successfully!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  // Simulator Calculations
  const simDeliveryFee = Math.max(form.minimumCustomerDeliveryFee, Math.round(simDistanceKm * form.customerDeliveryPerKm * 100) / 100);
  const simSmallOrderFee = simSubtotal > 0 && simSubtotal < form.smallOrderThreshold ? form.smallOrderFee : 0;
  const simTaxes = Math.round(simSubtotal * 0.05 * 100) / 100;
  const simPackagingFee = 15;
  const simCustomerTotal = simSubtotal + simDeliveryFee + form.platformFee + simSmallOrderFee + simPackagingFee + simTaxes + simTip;

  const simCommission = Math.round(simSubtotal * (form.restaurantCommissionPercent / 100) * 100) / 100;
  const simRestaurantSettlement = Math.round((simSubtotal + simPackagingFee - simCommission) * 100) / 100;

  const simRiderDistancePay = Math.round(simDistanceKm * form.riderPerKmPay * 100) / 100;
  const simRiderPayout = form.riderBasePay + simRiderDistancePay + form.riderWaitingPay + form.riderPeakBonus + form.riderLongDistanceBonus + form.riderBatchBonus + simTip;

  const simPlatformRevenue = simCommission + form.platformFee + simSmallOrderFee + simDeliveryFee;
  const simPlatformCost = simRiderPayout - simTip;
  const simPlatformContribution = Math.round((simPlatformRevenue - simPlatformCost) * 100) / 100;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900">Pricing &amp; Unit Economics Engine</h1>
            <span className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              SUPERADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure 3-sided platform pricing (Restaurant Commission, Customer Delivery &amp; Platform Fees, Rider Pay Engine) with PostgreSQL persistence
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPricingConfig}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Config</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Pricing Configuration Controls */}
        <form onSubmit={handleSaveConfig} className="lg:col-span-7 space-y-6">
          {/* SECTION 1: RESTAURANT COMMISSION */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">1. Restaurant Commission</h2>
                <p className="text-[11px] text-gray-500">Platform take-rate on food subtotal</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Restaurant Commission Rate (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.restaurantCommissionPercent}
                  onChange={(e) => setForm({ ...form, restaurantCommissionPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">Default: 13.0% (Lower commission empowers restaurant growth)</p>
            </div>
          </div>

          {/* SECTION 2: CUSTOMER FEES */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">2. Customer Delivery &amp; Platform Fees</h2>
                <p className="text-[11px] text-gray-500">Dynamic delivery calculation &amp; small order rules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Customer Delivery Fee per Km (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={form.customerDeliveryPerKm}
                  onChange={(e) => setForm({ ...form, customerDeliveryPerKm: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹7 / km</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Minimum Customer Delivery Fee (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.minimumCustomerDeliveryFee}
                  onChange={(e) => setForm({ ...form, minimumCustomerDeliveryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹25 minimum</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Platform / Convenience Fee (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.platformFee}
                  onChange={(e) => setForm({ ...form, platformFee: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹10 per order</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Small Order Threshold (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.smallOrderThreshold}
                  onChange={(e) => setForm({ ...form, smallOrderThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: Below ₹199</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Small Order Fee (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.smallOrderFee}
                  onChange={(e) => setForm({ ...form, smallOrderFee: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹10 fee</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: RIDER PAYOUT ENGINE */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Bike className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">3. Rider Payout &amp; Incentive Engine</h2>
                <p className="text-[11px] text-gray-500">Base pay, distance pay, waiting &amp; surge bonuses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rider Base Pay (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.riderBasePay}
                  onChange={(e) => setForm({ ...form, riderBasePay: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹30 per delivery</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rider Distance Pay (₹ / km)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={form.riderPerKmPay}
                  onChange={(e) => setForm({ ...form, riderPerKmPay: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹7 / km</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rider Waiting Pay (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={form.riderWaitingPay}
                  onChange={(e) => setForm({ ...form, riderWaitingPay: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Waiting time compensation</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Peak / Surge Incentive (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={form.riderPeakBonus}
                  onChange={(e) => setForm({ ...form, riderPeakBonus: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Peak hour surge bonus</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Long Distance Bonus (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={form.riderLongDistanceBonus}
                  onChange={(e) => setForm({ ...form, riderLongDistanceBonus: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Extra bonus for long trips</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Batch Order Bonus (₹)</label>
                <input
                  type="number"
                  step="1"
                  value={form.riderBatchBonus}
                  onChange={(e) => setForm({ ...form, riderBatchBonus: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Bonus for batched orders</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-purple-600 px-8 py-4 text-xs font-black text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Config...' : 'Save Pricing Configuration'}</span>
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: Live Unit Economics Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calculator className="h-5 w-5 text-purple-600 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Live Unit Economics Simulator</h3>
                <p className="text-[11px] text-gray-500">Real-time contribution margin test</p>
              </div>
            </div>

            {/* Simulation Controls */}
            <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Food Subtotal: <span className="text-purple-600">₹{simSubtotal}</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="10"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Delivery Distance: <span className="text-purple-600">{simDistanceKm} km</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={simDistanceKm}
                  onChange={(e) => setSimDistanceKm(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Customer Rider Tip: <span className="text-purple-600">₹{simTip}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simTip}
                  onChange={(e) => setSimTip(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            {/* Breakdown Output */}
            <div className="space-y-2 text-xs divide-y divide-gray-100 pt-1">
              <div className="pt-2 flex justify-between">
                <span className="text-gray-600">Customer Delivery Fee ({simDistanceKm} km)</span>
                <span className="font-bold text-gray-900">₹{simDeliveryFee}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-bold text-gray-900">₹{form.platformFee}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-600">Small Order Fee</span>
                <span className="font-bold text-gray-900">₹{simSmallOrderFee}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-gray-600">Customer Total (inc. ₹{simTip} tip)</span>
                <span className="font-black text-purple-700 text-sm">₹{simCustomerTotal}</span>
              </div>

              <div className="pt-3 flex justify-between text-orange-700">
                <span className="font-medium">Restaurant Commission ({form.restaurantCommissionPercent}%)</span>
                <span className="font-bold">₹{simCommission}</span>
              </div>
              <div className="pt-2 flex justify-between text-orange-900">
                <span className="font-medium">Restaurant Net Settlement</span>
                <span className="font-bold">₹{simRestaurantSettlement}</span>
              </div>

              <div className="pt-3 flex justify-between text-indigo-700">
                <span className="font-medium">Rider Base + Distance Pay</span>
                <span className="font-bold">₹{form.riderBasePay + simRiderDistancePay}</span>
              </div>
              <div className="pt-2 flex justify-between text-indigo-900">
                <span className="font-medium">Total Rider Payout (100% tip)</span>
                <span className="font-bold">₹{simRiderPayout}</span>
              </div>

              {/* Final Contribution Margin Card */}
              <div className={`pt-3 p-4 rounded-2xl border ${simPlatformContribution >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block">FoodHub Contribution Margin</span>
                    <span className="text-xs font-medium">Revenue (₹{simPlatformRevenue}) - Delivery Cost (₹{simPlatformCost})</span>
                  </div>
                  <span className="text-xl font-black">
                    {simPlatformContribution >= 0 ? `+₹${simPlatformContribution}` : `-₹${Math.abs(simPlatformContribution)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
