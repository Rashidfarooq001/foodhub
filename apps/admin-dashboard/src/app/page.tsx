'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Store,
  Bike,
  Users,
  CheckSquare,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { adminFetch } from '../utils/admin-fetch';
import { getApiBaseUrl } from '@foodhub/config';
import { io } from 'socket.io-client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await adminFetch('/analytics/admin');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const socketUrl = getApiBaseUrl().replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinAdmin');
    });

    const handleAdminUpdate = () => {
      fetchStats();
    };

    socket.on('order.created', handleAdminUpdate);
    socket.on('status.updated', handleAdminUpdate);

    return () => {
      socket.disconnect();
    };
  }, []);

  const kpi = {
    todayRevenue: stats?.todayRevenue ?? 0,
    todayOrders: stats?.todayOrders ?? 0,
    activeRestaurants: stats?.activeRestaurants ?? 0,
    onlineDrivers: stats?.onlineDrivers ?? 0,
    totalCustomers: stats?.totalCustomers ?? 0,
    pendingApprovals: stats?.pendingApprovals ?? 0,
    pendingDriverApprovals: stats?.pendingDriverApprovals ?? 0,
    weeklyRevenueData: stats?.weeklyRevenueData ?? [
      { day: 'Mon', revenue: 0 },
      { day: 'Tue', revenue: 0 },
      { day: 'Wed', revenue: 0 },
      { day: 'Thu', revenue: 0 },
      { day: 'Fri', revenue: 0 },
      { day: 'Sat', revenue: 0 },
      { day: 'Sun', revenue: 0 },
    ],
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Platform Command Center
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Real-time GMV revenue, live orders, onboarding verification &amp; ecosystem health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Alert Pills for Pending Approvals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Link
          href="/restaurants/approval"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black text-purple-950 block">Restaurant Approval Queue</span>
              <span className="text-[10px] text-purple-800 font-bold">Verify merchant licenses &amp; FSSAI</span>
            </div>
          </div>
          <span className="rounded-xl bg-purple-600 px-3 py-1 text-xs font-black text-white">
            {kpi.pendingApprovals} Pending
          </span>
        </Link>

        <Link
          href="/delivery-partners/approval"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 transition shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Bike className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black text-teal-950 block">Driver Approval Queue</span>
              <span className="text-[10px] text-teal-800 font-bold">Verify driving licenses &amp; RC documents</span>
            </div>
          </div>
          <span className="rounded-xl bg-teal-600 px-3 py-1 text-xs font-black text-white">
            {kpi.pendingDriverApprovals} Pending
          </span>
        </Link>
      </div>

      {/* Platform KPIs: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Today GMV */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">TODAY GMV</span>
            <DollarSign className="h-6 w-6 rounded-xl bg-purple-50 p-1.5 text-purple-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-purple-600">
            ₹{kpi.todayRevenue.toLocaleString()}
          </h2>
          <span className="text-[10px] text-purple-700 font-bold block">
            Gross food turnover
          </span>
        </div>

        {/* Today Orders */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">TODAY ORDERS</span>
            <ShoppingBag className="h-6 w-6 rounded-xl bg-orange-50 p-1.5 text-orange-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            {kpi.todayOrders}
          </h2>
          <span className="text-[10px] text-gray-500 font-semibold block">
            Platform volume
          </span>
        </div>

        {/* Active Restaurants */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">RESTAURANTS</span>
            <Store className="h-6 w-6 rounded-xl bg-emerald-50 p-1.5 text-emerald-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            {kpi.activeRestaurants}
          </h2>
          <span className="text-[10px] text-emerald-600 font-bold block">
            Approved &amp; active stores
          </span>
        </div>

        {/* Active Riders */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">COURIER FLEET</span>
            <Bike className="h-6 w-6 rounded-xl bg-blue-50 p-1.5 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900">
            {kpi.onlineDrivers}
          </h2>
          <span className="text-[10px] text-blue-600 font-bold block">
            Riders on duty
          </span>
        </div>
      </div>

      {/* Revenue & Growth Chart */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-black text-gray-900">
              Weekly Platform GMV
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500">
              Aggregated merchant sales across city operational hubs
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            Active Volume
          </span>
        </div>

        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpi.weeklyRevenueData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area dataKey="revenue" stroke="#9333ea" fill="#c084fc" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
