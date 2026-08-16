'use client';

import React, { useState, useEffect } from 'react';
import { Banknote, CheckCircle2, Clock, ShieldCheck, Building, History } from 'lucide-react';
import { DriverStats } from '../../data/delivery-mock-data';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DeliverySettlementPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettlementData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub-delivery-auth') : null;
        let authHeader = {};
        if (token) {
          try {
            const parsed = JSON.parse(token);
            const rawToken = parsed.state?.accessToken || parsed.accessToken;
            if (rawToken) authHeader = { Authorization: `Bearer ${rawToken}` };
          } catch { /* noop */ }
        }

        const [statsRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/delivery/stats`, { headers: authHeader }),
          fetch(`${API_BASE}/delivery/history`, { headers: authHeader }),
        ]);

        if (statsRes.ok) {
          const data: DriverStats = await statsRes.json();
          setStats(data);
        }
        if (historyRes.ok) {
          const histData = await historyRes.json();
          setHistory(Array.isArray(histData) ? histData : []);
        }
      } catch {
        /* backend offline */
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettlementData();
  }, []);

  const totalEarnings = stats?.totalEarnings ?? stats?.weeklyEarnings ?? 0;
  const pendingSettlement = stats?.pendingSettlement ?? totalEarnings;
  const availableForSettlement = stats?.availableForSettlement ?? totalEarnings;
  const settledAmount = stats?.settledAmount ?? 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Settlements & Payout Ledger</h1>
        <p className="text-xs text-gray-500">Official courier delivery earnings, settlement cycles & direct bank transfer records</p>
      </div>

      {/* Settlement Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Lifetime Earnings</span>
          <h3 className="text-3xl font-black text-gray-900">₹{totalEarnings}</h3>
          <p className="text-[10px] text-gray-400 font-bold">Sum of all completed trip payouts</p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Pending Settlement</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-3xl font-black text-amber-900">₹{pendingSettlement}</h3>
          <p className="text-[10px] text-amber-700 font-bold">Scheduled for next automated payout cycle</p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Available For Settlement</span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-black text-emerald-900">₹{availableForSettlement}</h3>
          <p className="text-[10px] text-emerald-700 font-bold">Eligible for admin bank disbursement</p>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Settled to Bank</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-3xl font-black text-blue-900">₹{settledAmount}</h3>
          <p className="text-[10px] text-blue-700 font-bold">Transferred via IMPS / NEFT</p>
        </div>
      </div>

      {/* Direct Bank Account Details Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Registered Bank Settlement Account</h3>
            <p className="text-xs text-gray-500">Payouts are processed directly to your registered bank account by platform finance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-gray-700">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Account Holder</span>
            <span className="text-gray-900 font-black">Verified Courier Partner</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Bank Name</span>
            <span className="text-gray-900 font-black">HDFC Bank / J&K Bank (Primary)</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Settlement Method</span>
            <span className="text-emerald-700 font-black">Direct Bank NEFT / IMPS Transfer</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 pt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Earnings are calculated automatically per completed order and cannot be manually modified.</span>
        </div>
      </div>

      {/* Order Earning Records History */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-black text-gray-900">Completed Delivery Earnings History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Rider Payout</th>
                <th className="px-4 py-3">Delivered At</th>
                <th className="px-4 py-3">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading delivery earnings records...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No delivered orders yet. Complete deliveries to generate settlements.</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-black text-gray-900">{h.orderNumber}</td>
                    <td className="px-4 py-3">{h.restaurantName}</td>
                    <td className="px-4 py-3">{h.distanceKm} km</td>
                    <td className="px-4 py-3 font-black text-emerald-600">₹{h.riderPayout}</td>
                    <td className="px-4 py-3 text-gray-500">{h.deliveredAt ? new Date(h.deliveredAt).toLocaleDateString('en-IN') : 'Recent'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                        EARNED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
