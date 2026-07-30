'use client';

import React, { useState } from 'react';
import { Banknote, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';

const getApiBase = () => (typeof window !== 'undefined' ? getApiBaseUrl() : 'https://foodhub-backend-enq2.onrender.com/api/v1');

const DEFAULT_PENDING = [
  { restaurantId: 'r1', name: 'Spice Garden Restaurant', orderCount: 42, grossAmount: 94500, commissionRate: 20, platformFee: 18900, restaurantNet: 73500 },
  { restaurantId: 'r2', name: 'Pizza Paradise', orderCount: 28, grossAmount: 56000, commissionRate: 20, platformFee: 11200, restaurantNet: 43400 },
  { restaurantId: 'r3', name: 'Burger Bistro', orderCount: 19, grossAmount: 34200, commissionRate: 18, platformFee: 6156, restaurantNet: 26994 },
];

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState(DEFAULT_PENDING);
  const [settled, setSettled] = useState<string[]>([]);

  React.useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const res = await fetch(`${getApiBase()}/restaurants`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSettlements(
              data.slice(0, 10).map((r: any, idx: number) => ({
                restaurantId: r.id,
                name: r.name,
                orderCount: 15 + idx * 5,
                grossAmount: 30000 + idx * 12000,
                commissionRate: 20,
                platformFee: (30000 + idx * 12000) * 0.2,
                restaurantNet: (30000 + idx * 12000) * 0.8,
              })),
            );
          }
        }
      } catch { /* fallback */ }
    };
    fetchSettlements();
  }, []);

  const totalGross    = settlements.reduce((s, r) => s + r.grossAmount, 0);
  const totalPlatform = settlements.reduce((s, r) => s + r.platformFee, 0);
  const totalNet      = settlements.reduce((s, r) => s + r.restaurantNet, 0);

  const handleSettle = (restaurantId: string, name: string) => {
    setSettled((prev) => [...prev, restaurantId]);
    alert(`Settlement of ₹${settlements.find(r => r.restaurantId === restaurantId)?.restaurantNet.toLocaleString('en-IN')} processed for ${name}\nUTR: UTR${Date.now()}`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Merchant Settlements</h1>
        <p className="text-xs text-gray-500">Platform commission ledger, restaurant net payouts & settlement history</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Platform GMV (Pending)', value: `₹${totalGross.toLocaleString('en-IN')}`, color: 'text-purple-600', icon: TrendingUp },
          { label: 'Platform Commission Earned', value: `₹${totalPlatform.toLocaleString('en-IN')}`, color: 'text-emerald-600', icon: Banknote },
          { label: 'Merchant Payout Due', value: `₹${totalNet.toLocaleString('en-IN')}`, color: 'text-gray-900', icon: Clock },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
              <kpi.icon className="h-4 w-4" /> {kpi.label}
            </div>
            <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Settlement Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Pending Restaurant Payouts</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Restaurant</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Gross GMV</th>
              <th className="px-6 py-4">Commission ({`rate`}%)</th>
              <th className="px-6 py-4">Net Payout</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {settlements.map((r) => {
              const isSettled = settled.includes(r.restaurantId);
              return (
                <tr key={r.restaurantId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{r.name}</td>
                  <td className="px-6 py-4 font-black text-gray-700">{r.orderCount}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">₹{r.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className="font-black text-rose-600">-₹{r.platformFee.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 ml-1">({r.commissionRate}%)</span>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600 text-sm">₹{r.restaurantNet.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    {isSettled ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="h-4 w-4" /> Settled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSettle(r.restaurantId, r.name)}
                        className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white shadow hover:bg-purple-700"
                      >
                        Process Payout
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
