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
      fetchStats();
    });

    const handleAdminUpdate = () => {
      fetchStats();
    };

    socket.on('order.created', handleAdminUpdate);
    socket.on('order.status_updated', handleAdminUpdate);

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
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-[14px]">
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] font-bold text-gray-900 leading-[1.15] mb-[4px] truncate">
            Platform Command Center
          </h1>
          <p className="text-[13px] text-gray-500 leading-[1.4] truncate">
            Real-time GMV, live orders, onboarding & ecosystem health
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 h-[40px] w-[40px] sm:w-auto sm:px-3.5 text-xs font-bold text-gray-700 transition"
          aria-label="Refresh Dashboard"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline sm:ml-1.5">Refresh</span>
        </button>
      </div>

      {/* Action Alert Pills for Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px]">
        <Link
          href="/restaurants/approval"
          className="flex items-center justify-between p-[12px] rounded-[14px] sm:rounded-[16px] border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 transition h-[76px]"
        >
          <div className="flex items-center gap-[10px] min-w-0">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-purple-600 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[15px] font-bold text-gray-900 block leading-tight truncate">
                Restaurant Approval
              </span>
              <span className="text-[12px] text-gray-500 block mt-0.5 truncate">
                Verify licenses & FSSAI
              </span>
            </div>
          </div>
          <span className="flex items-center justify-center w-[40px] h-7 rounded-[10px] bg-purple-100 text-[13px] font-bold text-purple-700 shrink-0 border border-purple-200 ml-2">
            {kpi.pendingApprovals}
          </span>
        </Link>

        <Link
          href="/delivery-partners/approval"
          className="flex items-center justify-between p-[12px] rounded-[14px] sm:rounded-[16px] border border-teal-200 bg-teal-50/40 hover:bg-teal-100/60 transition h-[76px]"
        >
          <div className="flex items-center gap-[10px] min-w-0">
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-teal-600 text-white">
              <Bike className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[15px] font-bold text-gray-900 block leading-tight truncate">
                Driver Approval
              </span>
              <span className="text-[12px] text-gray-500 block mt-0.5 truncate">
                Verify licenses & RC documents
              </span>
            </div>
          </div>
          <span className="flex items-center justify-center w-[40px] h-7 rounded-[10px] bg-teal-100 text-[13px] font-bold text-teal-700 shrink-0 border border-teal-200 ml-2">
            {kpi.pendingDriverApprovals}
          </span>
        </Link>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
        {/* Today GMV */}
        <div className="flex flex-col justify-between rounded-[14px] sm:rounded-[16px] border border-gray-100 bg-white p-[12px] shadow-sm h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider truncate mr-1">
              TODAY GMV
            </span>
            <DollarSign className="h-[24px] w-[24px] rounded-md bg-orange-50 p-1 text-orange-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-[24px] font-black text-gray-900 leading-[1.1] truncate">
              &#8377;{kpi.todayRevenue.toLocaleString()}
            </h2>
            <span className="text-[11px] text-gray-500 block truncate">Gross turnover</span>
          </div>
        </div>

        {/* Today Orders */}
        <div className="flex flex-col justify-between rounded-[14px] sm:rounded-[16px] border border-gray-100 bg-white p-[12px] shadow-sm h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider truncate mr-1">
              TODAY ORDERS
            </span>
            <ShoppingBag className="h-[24px] w-[24px] rounded-md bg-blue-50 p-1 text-blue-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-[24px] font-black text-gray-900 leading-[1.1] truncate">
              {kpi.todayOrders}
            </h2>
            <span className="text-[11px] text-gray-500 block truncate">Platform volume</span>
          </div>
        </div>

        {/* Active Restaurants */}
        <div className="flex flex-col justify-between rounded-[14px] sm:rounded-[16px] border border-gray-100 bg-white p-[12px] shadow-sm h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider truncate mr-1">
              RESTAURANTS
            </span>
            <Store className="h-[24px] w-[24px] rounded-md bg-purple-50 p-1 text-purple-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-[24px] font-black text-gray-900 leading-[1.1] truncate">
              {kpi.activeRestaurants}
            </h2>
            <span className="text-[11px] text-gray-500 block truncate">Approved stores</span>
          </div>
        </div>

        {/* Active Riders */}
        <div className="flex flex-col justify-between rounded-[14px] sm:rounded-[16px] border border-gray-100 bg-white p-[12px] shadow-sm h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider truncate mr-1">
              COURIER FLEET
            </span>
            <Bike className="h-[24px] w-[24px] rounded-md bg-teal-50 p-1 text-teal-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-[24px] font-black text-gray-900 leading-[1.1] truncate">
              {kpi.onlineDrivers}
            </h2>
            <span className="text-[11px] text-gray-500 block truncate">Active riders</span>
          </div>
        </div>
      </div>

      {/* Revenue & Growth Chart */}
      <div className="rounded-[14px] sm:rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">Weekly Platform GMV</h2>
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
