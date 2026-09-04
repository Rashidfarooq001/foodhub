'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  UtensilsCrossed,
  Bike,
  MenuSquare,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

import { useKitchenStore } from '../stores/use-kitchen-store';
import { useHotelAuthStore } from '../stores/use-hotel-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface RestaurantStats {
  todayRevenue: number;
  activeRevenue?: number;
  activeNetPayout?: number;
  activeCommission?: number;
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
  const { accessToken } = useHotelAuthStore();

  const [gstRate, setGstRate] = useState(5);
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) {
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

        const [statsRes, ordersRes, configRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/restaurant`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${API_BASE}/orders?status=PENDING,ACCEPTED,PREPARING,READY_FOR_PICKUP`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${API_BASE}/pricing/config`),
          fetch(`${API_BASE}/analytics/restaurant`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${API_BASE}/orders?status=PENDING,ACCEPTED,PREPARING,READY_FOR_PICKUP`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        if (configRes && configRes.ok) {
          const configData = await configRes.json();
          if (configData.foodGstRate) setGstRate(configData.foodGstRate);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setQueue(Array.isArray(ordersData) ? ordersData : (ordersData.orders ?? []));
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
    activeRevenue: stats?.activeRevenue ?? 0,
    activeNetPayout: stats?.activeNetPayout ?? 0,
    activeCommission: stats?.activeCommission ?? 0,
    todayOrders: stats?.todayOrders ?? 0,
    completedOrders: stats?.completedOrders ?? 0,
    cancelledOrders: stats?.cancelledOrders ?? 0,
    pendingOrders: stats?.pendingOrders ?? queue.filter((o: any) => o.status === 'PENDING').length,
    avgRating: stats?.avgRating ?? 0,
    totalReviews: stats?.totalReviews ?? 0,
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

  const isPendingApproval = me?.restaurant?.status === 'PENDING_APPROVAL';
  const isSuspended = me?.restaurant?.status === 'SUSPENDED';
  const isRejected = me?.restaurant?.status === 'REJECTED';

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full max-w-full overflow-x-hidden">
      {isPendingApproval && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4 text-xs font-bold text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-black text-amber-800 uppercase tracking-wider text-[10px] block">
              Application Status
            </span>
            <span>
              Your restaurant application is currently pending administrator verification.
            </span>
          </div>
          <span className="rounded-xl bg-amber-200 px-3 py-1 text-[10px] font-black text-amber-900 self-start sm:self-auto">
            PENDING APPROVAL
          </span>
        </div>
      )}

      {isSuspended && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 sm:p-4 text-xs font-bold text-rose-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-black text-rose-800 uppercase tracking-wider text-[10px] block">
              Account Status
            </span>
            <span>
              Your restaurant has been suspended. You cannot accept new orders. Please contact
              support.
            </span>
          </div>
          <span className="rounded-xl bg-rose-200 px-3 py-1 text-[10px] font-black text-rose-900 self-start sm:self-auto">
            SUSPENDED
          </span>
        </div>
      )}

      {isRejected && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 sm:p-4 text-xs font-bold text-red-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-black text-red-800 uppercase tracking-wider text-[10px] block">
              Application Status
            </span>
            <span>Your application has been rejected by administration.</span>
          </div>
          <span className="rounded-xl bg-red-200 px-3 py-1 text-[10px] font-black text-red-900 self-start sm:self-auto">
            REJECTED
          </span>
        </div>
      )}

      {/* Mobile-First Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 sm:pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Kitchen Dashboard
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Live orders queue, daily revenue &amp; operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/kitchen-queue"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-2.5 sm:py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-orange-700 transition min-h-[44px]"
          >
            <UtensilsCrossed className="h-4 w-4" />
            <span>Open Kitchen KDS ({queue.length})</span>
          </Link>
        </div>
      </div>

      {/* Quick Operational Jump Actions */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Link
          href="/kitchen-queue"
          className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 transition min-h-[44px]"
        >
          <UtensilsCrossed className="h-5 w-5 text-orange-600 mb-1" />
          <span className="text-[11px] sm:text-xs font-black text-orange-900">Live KDS</span>
          <span className="text-[9px] text-orange-700 font-bold">{queue.length} Active</span>
        </Link>

        <Link
          href="/menu"
          className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition min-h-[44px]"
        >
          <MenuSquare className="h-5 w-5 text-gray-700 mb-1" />
          <span className="text-[11px] sm:text-xs font-black text-gray-900">Menu Catalog</span>
          <span className="text-[9px] text-gray-500 font-bold">Manage Items</span>
        </Link>

        <Link
          href="/delivery-management"
          className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition min-h-[44px]"
        >
          <Bike className="h-5 w-5 text-emerald-600 mb-1" />
          <span className="text-[11px] sm:text-xs font-black text-gray-900">Delivery</span>
          <span className="text-[9px] text-emerald-700 font-bold">Live Tracking</span>
        </Link>
      </div>

      {/* KPI Cards: 2-col on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        {/* Today Revenue */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-3.5 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black uppercase text-gray-400">
                TODAY SALES
              </span>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-emerald-50 p-1.5 text-emerald-600" />
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 mt-2">
              ₹{kpi.activeRevenue.toLocaleString()}
            </h2>
          </div>
          <p className="mt-2 text-[10px] sm:text-xs font-bold text-emerald-600">Gross food sales</p>
        </div>

        {/* Today Orders */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-3.5 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black uppercase text-gray-400">
                TODAY ORDERS
              </span>
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-orange-50 p-1.5 text-orange-600" />
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 mt-2">
              {kpi.todayOrders}
            </h2>
          </div>
          <p className="mt-2 text-[10px] sm:text-xs text-gray-500 font-semibold">
            Completed: {kpi.completedOrders}
          </p>
        </div>

        {/* Active Orders */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-3.5 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black uppercase text-gray-400">
                ACTIVE QUEUE
              </span>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-blue-50 p-1.5 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 mt-2">
              {queue.length}
            </h2>
          </div>
          <p className="mt-2 text-[10px] sm:text-xs text-blue-600 font-bold">
            Pending accept: {kpi.pendingOrders}
          </p>
        </div>

        {/* Customer Rating */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-3.5 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-black uppercase text-gray-400">
                AVG RATING
              </span>
              <Star className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-amber-50 p-1.5 text-amber-500" />
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 mt-2">
              {kpi.avgRating > 0 ? kpi.avgRating.toFixed(1) : '4.8'} ★
            </h2>
          </div>
          <p className="mt-2 text-[10px] sm:text-xs text-gray-500 font-semibold">
            {kpi.totalReviews} verified reviews
          </p>
        </div>
      </div>

      {/* Sec 9(5) ECO Merchant Settlement Breakdown */}
      <div className="rounded-2xl sm:rounded-3xl border border-orange-100 bg-orange-50/30 p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">
              Weekly Settlement &amp; Tax Summary
            </h2>
            <p className="text-[10px] sm:text-[11px] text-gray-500">
              Statutory GST compliance &amp; payout calculation
            </p>
          </div>
          <Link
            href="/settlements"
            className="text-[10px] font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 border border-orange-200 px-3 py-1 rounded-full uppercase transition min-h-[32px] flex items-center"
          >
            View Weekly Settlements →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-0.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase block">Weekly Sales</span>
            <span className="text-base sm:text-lg font-black text-gray-900">
              ₹{kpi.activeRevenue.toLocaleString()}
            </span>
            <span className="text-[9px] text-gray-400 block">Food subtotal</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-0.5">
            <span className="text-[9px] font-bold text-teal-700 uppercase block">
              Sec 9(5) GST ({gstRate}%)
            </span>
            <span className="text-base sm:text-lg font-black text-teal-800">
              ₹{Math.round(kpi.activeRevenue * (gstRate / 100)).toLocaleString()}
            </span>
            <span className="text-[9px] text-teal-600 font-bold block">Remitted by ZaykaFood</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-0.5">
            <span className="text-[9px] font-bold text-orange-700 uppercase block">
              Commission Rate
            </span>
            <span className="text-base sm:text-lg font-black text-orange-800">Dynamic</span>
            <span className="text-[9px] text-orange-600 block">Contracted Rate</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-0.5">
            <span className="text-[9px] font-bold text-emerald-700 uppercase block">
              Net Payout
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-800">
              ₹{kpi.activeNetPayout.toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-600 font-bold block">To Bank Account</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="mb-4 sm:mb-6 text-sm sm:text-base md:text-lg font-black text-gray-900">
          Weekly Revenue Performance
        </h2>
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={kpi.weeklyRevenueData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area dataKey="revenue" stroke="#ea580c" fill="#fdba74" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Kitchen Queue Stream */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base md:text-lg font-black text-gray-900">
            Active Orders Queue ({queue.length})
          </h2>
          <Link
            href="/kitchen-queue"
            className="text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            Open KDS Full View →
          </Link>
        </div>

        {queue.length === 0 ? (
          <div className="py-10 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No active orders in kitchen queue right now.
          </div>
        ) : (
          <div className="space-y-2.5">
            {queue.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 p-3 sm:p-4 hover:border-orange-200 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-gray-900">
                      #{order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`rounded-xl px-2 py-0.5 text-[9px] font-black uppercase ${
                        order.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'PREPARING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                    {order.customerName || 'Customer'} • ₹
                    {order.totalAmount || order.payableAmount || 0}
                  </p>
                </div>

                <Link
                  href="/kitchen-queue"
                  className="rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-2 text-[11px] font-black text-orange-800 transition min-h-[40px] flex items-center"
                >
                  Manage →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




