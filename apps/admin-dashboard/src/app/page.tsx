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
    <div className="w-full max-w-[1280px] mx-auto overflow-x-hidden pb-16 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex-1">
          <h1 className="text-[24px] sm:text-[28px] font-bold text-gray-900 leading-tight">
            Platform Command Center
          </h1>
          <p className="text-[14px] text-gray-500 leading-snug mt-1 max-w-lg hidden sm:block">
            Real-time GMV, live orders, onboarding and ecosystem health
          </p>
          <p className="text-[12px] text-gray-500 leading-snug mt-0.5 max-w-lg sm:hidden">
            Real-time GMV, live orders & onboarding
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-700 transition h-10"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Action Alert Pills for Pending Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          href="/restaurants/approval"
          className="flex items-center justify-between p-4 rounded-[16px] border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 transition min-h-[96px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-gray-900 block leading-tight">Restaurant Approval</span>
              <span className="text-[12px] text-gray-500 block mt-0.5">Verify licenses &amp; FSSAI</span>
            </div>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-[13px] font-bold text-purple-700 shrink-0 border border-purple-200">
            {kpi.pendingApprovals}
          </span>
        </Link>

        <Link
          href="/delivery-partners/approval"
          className="flex items-center justify-between p-4 rounded-[16px] border border-teal-200 bg-teal-50/40 hover:bg-teal-100/60 transition min-h-[96px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-gray-900 block leading-tight">Driver Approval</span>
              <span className="text-[12px] text-gray-500 block mt-0.5">Verify driving licenses &amp; RC documents</span>
            </div>
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-[13px] font-bold text-teal-700 shrink-0 border border-teal-200">
            {kpi.pendingDriverApprovals}
          </span>
        </Link>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today GMV */}
        <div className="flex flex-col rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">TODAY GMV</span>
            <DollarSign className="h-6 w-6 rounded-lg bg-orange-50 p-1.5 text-orange-600" />
          </div>
          <div className="mt-auto">
            <h2 className="text-[26px] font-black text-gray-900 leading-none mb-1">
              ?{kpi.todayRevenue.toLocaleString()}
            </h2>
            <span className="text-[12px] text-gray-500">Gross turnover</span>
          </div>
        </div>

        {/* Today Orders */}
        <div className="flex flex-col rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">TODAY ORDERS</span>
            <ShoppingBag className="h-6 w-6 rounded-lg bg-blue-50 p-1.5 text-blue-600" />
          </div>
          <div className="mt-auto">
            <h2 className="text-[26px] font-black text-gray-900 leading-none mb-1">
              {kpi.todayOrders}
            </h2>
            <span className="text-[12px] text-gray-500">Platform volume</span>
          </div>
        </div>

        {/* Active Restaurants */}
        <div className="flex flex-col rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">RESTAURANTS</span>
            <Store className="h-6 w-6 rounded-lg bg-emerald-50 p-1.5 text-emerald-600" />
          </div>
          <div className="mt-auto">
            <h2 className="text-[26px] font-black text-gray-900 leading-none mb-1">
              {kpi.activeRestaurants}
            </h2>
            <span className="text-[12px] text-gray-500">Approved stores</span>
          </div>
        </div>

        {/* Active Riders */}
        <div className="flex flex-col rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">COURIER FLEET</span>
            <Bike className="h-6 w-6 rounded-lg bg-blue-50 p-1.5 text-blue-600" />
          </div>
          <div className="mt-auto">
            <h2 className="text-[26px] font-black text-gray-900 leading-none mb-1">
              {kpi.onlineDrivers}
            </h2>
            <span className="text-[12px] text-gray-500">Active riders</span>
          </div>
        </div>
      </div>

      {/* Revenue & Growth Chart */}
      <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">
              Weekly Platform GMV
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
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
