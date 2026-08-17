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
  CreditCard,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { adminFetch } from '../../utils/admin-fetch';

const API_BASE = getApiBaseUrl();

interface PricingConfigForm {
  restaurantCommissionPercent: number | '' | null;
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
  paymentGatewayPlanningRate: number;
}

const DEFAULT_FORM: PricingConfigForm = {
  restaurantCommissionPercent: '',
  customerDeliveryPerKm: 0,
  minimumCustomerDeliveryFee: 15,
  platformFee: 3,
  smallOrderThreshold: 0,
  smallOrderFee: 0,
  riderBasePay: 25,
  riderPerKmPay: 6,
  riderWaitingPay: 0,
  riderPeakBonus: 0,
  riderLongDistanceBonus: 0,
  riderBatchBonus: 0,
  paymentGatewayPlanningRate: 2,
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
          restaurantCommissionPercent: data.restaurantCommissionPercent != null ? Number(data.restaurantCommissionPercent) : '',
          customerDeliveryPerKm: Number(data.customerDeliveryPerKm ?? 0),
          minimumCustomerDeliveryFee: Number(data.minimumCustomerDeliveryFee ?? 15),
          platformFee: Number(data.platformFee ?? 3),
          smallOrderThreshold: Number(data.smallOrderThreshold ?? 0),
          smallOrderFee: Number(data.smallOrderFee ?? 0),
          riderBasePay: Number(data.riderBasePay ?? 25),
          riderPerKmPay: Number(data.riderPerKmPay ?? 6),
          riderWaitingPay: Number(data.riderWaitingPay ?? 0),
          riderPeakBonus: Number(data.riderPeakBonus ?? 0),
          riderLongDistanceBonus: Number(data.riderLongDistanceBonus ?? 0),
          riderBatchBonus: Number(data.riderBatchBonus ?? 0),
          paymentGatewayPlanningRate: Number(data.paymentGatewayPlanningRate ?? 2),
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

    const commissionValue = form.restaurantCommissionPercent === '' || form.restaurantCommissionPercent === null
      ? null
      : Number(form.restaurantCommissionPercent);

    if (commissionValue !== null && (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100)) {
      setErrorMsg('Commission rate must be between 0% and 100% or left empty for UNCONFIGURED.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...form,
        restaurantCommissionPercent: commissionValue,
      };
      const res = await adminFetch('/pricing/config', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg('Central pricing configuration saved successfully to PostgreSQL.');
        fetchPricingConfig();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.message || 'Failed to update pricing configuration.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
    } finally {
      setSaving(false);
    }
  };

  // Live Unit Economics Calculation
  const commissionRateEffective = typeof form.restaurantCommissionPercent === 'number' ? form.restaurantCommissionPercent : 0;
  const isCommissionConfigured = typeof form.restaurantCommissionPercent === 'number';
  const restaurantCommission = Math.round(simSubtotal * (commissionRateEffective / 100) * 100) / 100;
  const customerDeliveryFee = form.minimumCustomerDeliveryFee;
  const platformFee = form.platformFee;
  const taxes = 0; // GST = 0
  const customerTotal = Math.round((simSubtotal + customerDeliveryFee + platformFee + taxes + simTip) * 100) / 100;
  const restaurantSettlement = Math.round((simSubtotal - restaurantCommission) * 100) / 100;
  const riderPayout = Math.round((form.riderBasePay + simDistanceKm * form.riderPerKmPay + form.riderWaitingPay + form.riderPeakBonus + form.riderLongDistanceBonus + form.riderBatchBonus + simTip) * 100) / 100;
  const platformRevenue = Math.round((restaurantCommission + platformFee + customerDeliveryFee) * 100) / 100;
  const riderDirectCost = riderPayout - simTip;
  const gatewayCost = Math.round(customerTotal * (form.paymentGatewayPlanningRate / 100) * 100) / 100;
  const contributionMargin = Math.round((platformRevenue - riderDirectCost - gatewayCost) * 100) / 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900">Pricing &amp; Unit Economics Engine</h1>
            <span className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              SUPERADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure dynamic platform pricing backed by PostgreSQL (Zero arbitrary defaults, fixed ₹15 delivery, ₹3 platform fee)
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
          {/* SECTION 1: GLOBAL RESTAURANT COMMISSION */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">1. Global Restaurant Commission Rate</h2>
                <p className="text-[11px] text-gray-500">Fallback rate when individual restaurant rate is unconfigured (NULL)</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Global Commission Rate (% or blank for UNCONFIGURED)
              </label>
              <div className="relative">
                <Percent className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Leave empty for UNCONFIGURED (0%)"
                  value={form.restaurantCommissionPercent === '' || form.restaurantCommissionPercent === null ? '' : form.restaurantCommissionPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, restaurantCommissionPercent: val === '' ? '' : parseFloat(val) });
                  }}
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                {form.restaurantCommissionPercent === '' || form.restaurantCommissionPercent === null ? (
                  <span className="text-amber-600 font-bold">Status: UNCONFIGURED (0% platform deduction)</span>
                ) : (
                  <span className="text-emerald-600 font-bold">Status: CONFIGURED at {form.restaurantCommissionPercent}%</span>
                )}
              </p>
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
                <p className="text-[11px] text-gray-500">Standard business fees enforced authoritatively</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Delivery Fee (Fixed ₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.minimumCustomerDeliveryFee}
                  onChange={(e) => setForm({ ...form, minimumCustomerDeliveryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Production Required: ₹15.00</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Platform Convenience Fee (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={form.platformFee}
                  onChange={(e) => setForm({ ...form, platformFee: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Production Required: ₹3.00</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: RIDER PAYOUT ENGINE */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Bike className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">3. Courier Partner Payout Model</h2>
                <p className="text-[11px] text-gray-500">Base compensation, per-km distance rates &amp; bonuses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rider Base Payout (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={form.riderBasePay}
                  onChange={(e) => setForm({ ...form, riderBasePay: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹25 / delivery</p>
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
                <p className="text-[10px] text-gray-400 mt-1">Default: ₹6 / km</p>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-xs font-black text-white shadow-xl shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving to Database...' : 'Save & Publish Live Configuration'}</span>
          </button>
        </form>

        {/* RIGHT COLUMN: Live Unit Economics Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-purple-100 pb-3">
              <Calculator className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Live Economics Simulator</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Test Food Subtotal (₹): {simSubtotal}</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(Number(e.target.value))}
                  className="w-full mt-1 accent-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">Delivery Distance (Km): {simDistanceKm} km</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={simDistanceKm}
                  onChange={(e) => setSimDistanceKm(Number(e.target.value))}
                  className="w-full mt-1 accent-purple-600"
                />
              </div>
            </div>

            <div className="divide-y divide-purple-100 text-xs pt-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Customer Grand Total</span>
                <span className="font-black text-gray-900">₹{customerTotal}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Merchant Commission</span>
                <span className="font-bold text-orange-600">
                  {isCommissionConfigured ? `₹${restaurantCommission} (${commissionRateEffective}%)` : 'UNCONFIGURED (₹0.00)'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Merchant Net Settlement</span>
                <span className="font-bold text-emerald-600">₹{restaurantSettlement}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Courier Partner Payout</span>
                <span className="font-bold text-gray-900">₹{riderPayout}</span>
              </div>
              <div className="flex justify-between py-2 font-black text-sm text-purple-700 border-t border-purple-200">
                <span>ZaykaFood Contribution Margin</span>
                <span>₹{contributionMargin}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
