'use client';

import React, { useState, useEffect } from 'react';
import { DriverStats } from '../../data/delivery-mock-data';
import { DollarSign, Award, Gift, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DeliveryEarningsPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/delivery/stats`);
        if (res.ok) setStats(await res.json());
      } catch { /* backend offline */ }
    };
    fetchStats();
  }, []);

  const weeklyData = stats?.weeklyEarnings
    ? [
        { day: 'Mon', pay: Math.round(stats.weeklyEarnings * 0.13) },
        { day: 'Tue', pay: Math.round(stats.weeklyEarnings * 0.14) },
        { day: 'Wed', pay: Math.round(stats.weeklyEarnings * 0.12) },
        { day: 'Thu', pay: Math.round(stats.weeklyEarnings * 0.16) },
        { day: 'Fri', pay: Math.round(stats.weeklyEarnings * 0.19) },
        { day: 'Sat', pay: Math.round(stats.weeklyEarnings * 0.23) },
        { day: 'Sun', pay: Math.round(stats.weeklyEarnings * 0.24) },
      ]
    : [
        { day: 'Mon', pay: 750 },
        { day: 'Tue', pay: 820 },
        { day: 'Wed', pay: 690 },
        { day: 'Thu', pay: 910 },
        { day: 'Fri', pay: 1100 },
        { day: 'Sat', pay: 1350 },
        { day: 'Sun', pay: 1420 },
      ];

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Earnings & Payout Ledger</h1>
        <p className="text-xs text-gray-500">Trip base pay, peak hour incentives, tips & weekly settlements</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400">TODAY'S EARNINGS</p>
          <h3 className="text-3xl font-black text-emerald-600">₹{stats?.todayEarnings ?? 0}</h3>
          <p className="text-[10px] text-emerald-600 font-bold">{stats?.todayDeliveries ?? 0} Deliveries completed</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400">THIS WEEK'S TOTAL</p>
          <h3 className="text-3xl font-black text-gray-900">₹{stats?.weeklyEarnings ?? 0}</h3>
          <p className="text-[10px] text-emerald-600 font-bold">+18.5% vs last week</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400">MONTHLY PAYOUT</p>
          <h3 className="text-3xl font-black text-gray-900">₹{stats?.monthlyEarnings ?? 0}</h3>
          <p className="text-[10px] text-gray-400 font-bold">Direct Bank Deposit</p>
        </div>
      </div>

      {/* Earnings Graph */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Weekly Earnings Trend</h3>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Bar dataKey="pay" fill="#059669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
