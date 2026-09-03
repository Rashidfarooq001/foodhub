'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Award, Gift, ArrowUpRight, RefreshCw, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

export default function DeliveryEarningsPage() {
  const { accessToken } = useDeliveryAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/stats`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) setStats(await res.json());
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [accessToken]);

  const weeklyData: { day: string; pay: number }[] =
    stats?.dailyEarningsBreakdown && stats.dailyEarningsBreakdown.length > 0
      ? stats.dailyEarningsBreakdown.map((d: { day: string; pay: number }) => ({
          day: d.day,
          pay: d.pay,
        }))
      : [];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Earnings &amp; Payout Ledger
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Trip base compensation, distance bonuses, customer tips &amp; weekly bank disbursements
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards: 2-col on mobile, 3-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800 block">
            TODAY EARNINGS
          </span>
          <div className="text-lg sm:text-2xl font-black text-emerald-900">
            ?{stats?.todayEarnings ?? 0}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block truncate">
            {stats?.todayDeliveries ?? 0} trips delivered
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 block">
            THIS WEEK TOTAL
          </span>
          <div className="text-lg sm:text-2xl font-black text-gray-900">
            ?{stats?.weeklyEarnings ?? 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block truncate">
            Scheduled Monday payout
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-blue-800 block">
            LIFETIME DISBURSED
          </span>
          <div className="text-lg sm:text-2xl font-black text-blue-950">
            ?{stats?.totalEarnings ?? stats?.monthlyEarnings ?? 0}
          </div>
          <span className="text-[10px] text-blue-700 font-bold block truncate">
            Transferred via NEFT / IMPS
          </span>
        </div>
      </div>

      {/* Earnings Trend Bar Chart */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black text-gray-900">Weekly Earnings Trend</h3>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Daily rider payout breakdown across current weekly cycle
            </p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            Active
          </span>
        </div>

        <div className="h-56 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip />
              <Bar dataKey="pay" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
