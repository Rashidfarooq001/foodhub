'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  ArrowUpRight,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import { useKitchenStore } from '../stores/use-kitchen-store';
import { useHotelAuthStore } from '../stores/use-hotel-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface RestaurantStats {
  todayRevenue: number;
  todayOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  avgRating: number;
  totalReviews: number;
  weeklyRevenueData: {
    day: string;
    revenue: number;
  }[];
}

export default function HotelDashboardPage() {
  const { queue, setQueue } = useKitchenStore();
 const {  accessToken } = useHotelAuthStore();
 
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) {
      console.warn('No access token');
      setIsLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setMe(meData);
        }

        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/restaurant`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),

          fetch(`${API_BASE}/orders?status=PENDING,PREPARING`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();

          setQueue(
            Array.isArray(ordersData)
              ? ordersData
              : ordersData.orders ?? [],
          );
        }
      } catch (err) {
        console.error('Dashboard loading failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [accessToken, setQueue]);

  const kpi = {
    todayRevenue: stats?.todayRevenue ?? 0,
    todayOrders: stats?.todayOrders ?? 0,
    completedOrders: stats?.completedOrders ?? 0,
    cancelledOrders: stats?.cancelledOrders ?? 0,
    pendingOrders: stats?.pendingOrders ?? 0,
    avgRating: stats?.avgRating ?? 0,
    totalReviews: stats?.totalReviews ?? 0,
    weeklyRevenueData: stats?.weeklyRevenueData ?? [],
  };

  const isPendingApproval = me?.restaurant?.status === 'PENDING_APPROVAL';

  return (
    <div className="space-y-8">
      {isPendingApproval && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-sm flex items-center justify-between">
          <div>
            <span className="font-black text-amber-800 uppercase tracking-wider text-[10px] block">Application Status</span>
            <span>Your restaurant application for <strong>{me?.restaurant?.name || 'your restaurant'}</strong> is currently pending admin review.</span>
          </div>
          <span className="rounded-xl bg-amber-200 px-3 py-1 text-[11px] font-black text-amber-900">PENDING APPROVAL</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Kitchen Overview
          </h1>

          <p className="text-xs text-gray-500">
            Live order queue, revenue metrics & performance analytics
          </p>
        </div>

        <Link
          href="/kitchen-queue"
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white shadow-lg hover:bg-orange-700"
        >
          <UtensilsCrossed className="h-4 w-4" />
          Open Kitchen Queue
        </Link>
      </div>

      {/* KPI Cards */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500">
            TODAY'S REVENUE
          </p>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-3xl font-black">
              ₹{kpi.todayRevenue.toLocaleString()}
            </h2>

            <DollarSign className="h-10 w-10 rounded-xl bg-green-100 p-2 text-green-600" />
          </div>

          <p className="mt-3 flex items-center gap-1 text-xs font-bold text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            Revenue Today
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500">
            TODAY'S ORDERS
          </p>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-3xl font-black">
              {kpi.todayOrders}
            </h2>

            <ShoppingBag className="h-10 w-10 rounded-xl bg-orange-100 p-2 text-orange-600" />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Completed: {kpi.completedOrders}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500">
            ACTIVE ORDERS
          </p>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-3xl font-black">
              {queue.length}
            </h2>

            <Clock className="h-10 w-10 rounded-xl bg-blue-100 p-2 text-blue-600" />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Pending: {kpi.pendingOrders}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-gray-500">
            CUSTOMER RATING
          </p>

          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-3xl font-black">
              {kpi.avgRating.toFixed(1)}
            </h2>

            <Star className="h-10 w-10 rounded-xl bg-yellow-100 p-2 text-yellow-500" />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {kpi.totalReviews} Reviews
          </p>
        </div>

      </div>

      {/* Sec 9(5) ECO Merchant Settlement Statement Breakdown */}
      <div className="rounded-3xl border border-orange-100 bg-orange-50/30 p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Sec 9(5) ECO Settlement &amp; Tax Statement</h2>
            <p className="text-[11px] text-gray-500">Statutory GST treatment &amp; FoodHub commission deduction breakdown</p>
          </div>
          <span className="text-[10px] font-bold text-orange-800 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full uppercase">
            Sec 9(5) Remitted by FoodHub
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">Today Food Sales</span>
            <span className="text-xl font-black text-gray-900">₹{kpi.todayRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 block">Gross food subtotal sales</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-teal-700 uppercase block">Sec 9(5) Food GST (5%)</span>
            <span className="text-xl font-black text-teal-800">₹{Math.round(kpi.todayRevenue * 0.05).toLocaleString()}</span>
            <span className="text-[10px] text-teal-600 font-bold block">Collected &amp; Remitted by FoodHub</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-orange-700 uppercase block">FoodHub Commission (13%) + GST</span>
            <span className="text-xl font-black text-orange-800">₹{Math.round(kpi.todayRevenue * 0.13 * 1.18).toLocaleString()}</span>
            <span className="text-[10px] text-orange-600 block">Commission ₹{Math.round(kpi.todayRevenue * 0.13)} + 18% GST</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-gray-100 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Net Bank Settlement</span>
            <span className="text-xl font-black text-emerald-800">₹{Math.round(kpi.todayRevenue - (kpi.todayRevenue * 0.13 * 1.18)).toLocaleString()}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">Food Sales - Commission &amp; GST</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}

      <div className="rounded-3xl border bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-lg font-black">
          Weekly Revenue
        </h2>

        <div className="h-72">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={kpi.weeklyRevenueData}>

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Area
                dataKey="revenue"
                stroke="#ea580c"
                fill="#fdba74"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* Kitchen Queue */}

      <div className="rounded-3xl border bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-black">
          Current Kitchen Queue
        </h2>

        {queue.length === 0 ? (

          <div className="py-12 text-center text-gray-400">
            No active kitchen orders
          </div>

        ) : (

          <div className="space-y-3">

            {queue.map((order: any) => (

              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border p-4"
              >

                <div>

                  <h3 className="font-bold">
                    #{order.orderNumber || order.id}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {order.customerName || 'Customer'}
                  </p>

                </div>

                <span className="rounded-xl bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                  {order.status}
                </span>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}