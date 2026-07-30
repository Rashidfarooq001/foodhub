'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminStats } from '../data/admin-mock-data';
import { DollarSign, ShoppingBag, Store, Bike, ArrowUpRight, CheckSquare } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getApiBaseUrl } from '@foodhub/config';

const getApiBase = () => (typeof window !== 'undefined' ? getApiBaseUrl() : 'https://foodhub-backend-enq2.onrender.com/api/v1');

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${getApiBase()}/analytics/admin`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Backend offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpi = {
    todayRevenue: stats?.todayRevenue ?? 0,
    todayOrders: stats?.todayOrders ?? 0,
    activeRestaurants: stats?.activeRestaurants ?? 0,
    onlineDrivers: stats?.onlineDrivers ?? 0,
    pendingApprovals: stats?.pendingApprovals ?? 0,
    cancelledOrders: stats?.cancelledOrders ?? 0,
    refundRequests: stats?.refundRequests ?? 0,
    platformGrowth: stats?.platformGrowth ?? '--',
    weeklyRevenueData: stats?.weeklyRevenueData ?? [],
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Platform Command Center</h1>
          <p className="text-xs text-gray-500">Real-time GMV revenue, order volumes, onboarding approvals &amp; system health</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/restaurants/approval"
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700"
          >
            <CheckSquare className="h-4 w-4" /> Restaurant Approvals ({kpi.pendingApprovals})
          </Link>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY&apos;S PLATFORM GMV</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-purple-600">₹{kpi.todayRevenue.toLocaleString()}</h3>
          )}
          <p className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> {kpi.platformGrowth} vs last week
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY&apos;S TOTAL ORDERS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.todayOrders.toLocaleString()}</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">{kpi.cancelledOrders} cancelled • {kpi.refundRequests} refunds</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>ACTIVE RESTAURANTS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Store className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.activeRestaurants} Stores</h3>
          )}
          <p className="text-[10px] text-orange-600 font-bold">18% Platform Commission Rate</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>ONLINE DRIVERS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-emerald-600">{kpi.onlineDrivers} Active</h3>
          )}
          <p className="text-[10px] text-emerald-600 font-bold">Average dispatch ETA ~14m</p>
        </div>
      </div>

      {/* Platform GMV Growth Chart */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Platform GMV Growth Trend (7 Days)</h3>
          <span className="text-xs font-bold text-purple-600">
            {kpi.weeklyRevenueData.length > 0
              ? `Total GMV: ₹${(kpi.weeklyRevenueData.reduce((s, d) => s + d.revenue, 0) / 100000).toFixed(2)} Lakhs`
              : '--'}
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-2xl bg-gray-50" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpi.weeklyRevenueData}>
                <defs>
                  <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
