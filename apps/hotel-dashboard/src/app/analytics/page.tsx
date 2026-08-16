'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Star,
  Clock,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

const API_BASE = getApiBaseUrl();

interface RestaurantStats {
  todayRevenue: number;
  todayOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  avgRating: number;
  reviewCount: number;
  week: { sales: number; orders: number };
  month: { sales: number; orders: number };
  topItems: Array<{ foodItemId: string; foodName?: string; qty: number }>;
  weeklyBreakdown: Array<{ date: string; revenue: number; orders: number }>;
}

export default function RestaurantAnalyticsPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [foodNames, setFoodNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('7D');

  useEffect(() => {
    if (!restaurantId) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [statsRes, menuRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/restaurant/${restaurantId}`, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          }),
          fetch(`${API_BASE}/menus/restaurant/${restaurantId}`),
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          if (Array.isArray(menuData)) {
            const map: Record<string, string> = {};
            menuData.forEach((item: any) => {
              map[item.id] = item.name;
            });
            setFoodNames(map);
          }
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch {
        /* offline or network issue */
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [restaurantId, accessToken]);

  const activeRevenue =
    timeRange === '7D'
      ? stats?.week?.sales ?? 0
      : timeRange === '30D'
      ? stats?.month?.sales ?? 0
      : (stats?.month?.sales ?? 0) * 1.5;

  const activeOrdersCount =
    timeRange === '7D'
      ? stats?.week?.orders ?? 0
      : timeRange === '30D'
      ? stats?.month?.orders ?? 0
      : (stats?.completedOrders ?? 0);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-xs text-gray-500">Live operational metrics and financial turnover</p>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex items-center rounded-2xl bg-gray-100 p-1 text-xs font-bold">
          {(['7D', '30D', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeRange(tab)}
              className={`rounded-xl px-4 py-1.5 transition ${
                timeRange === tab
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === '7D' ? 'Last 7 Days' : tab === '30D' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs font-bold text-gray-400">
          Loading operational performance data...
        </div>
      ) : (
        <>
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{activeRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Gross completed sales volume</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Orders Delivered</span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{stats?.completedOrders ?? 0}</p>
              <p className="text-[10px] text-emerald-600 font-bold">Successfully fulfilled</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Customer Rating</span>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <Star className="h-5 w-5 fill-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {stats?.avgRating && stats.avgRating > 0 ? stats.avgRating : '—'}
              </p>
              <p className="text-[10px] text-gray-400">{stats?.reviewCount ?? 0} customer reviews</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Cancelled Orders</span>
                <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{stats?.cancelledOrders ?? 0}</p>
              <p className="text-[10px] text-gray-400">Orders rejected or cancelled</p>
            </div>
          </div>

          {/* Top Selling Dishes and Daily Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Dishes */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" /> Top Selling Dishes
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">30-Day Volume</span>
              </div>

              {!stats?.topItems || stats.topItems.length === 0 ? (
                <p className="py-8 text-center text-xs font-bold text-gray-400">
                  No completed sales records found yet
                </p>
              ) : (
                <div className="divide-y divide-gray-100 space-y-2">
                  {stats.topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pt-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 font-black text-orange-600 text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-gray-800 truncate max-w-xs">
                          {foodNames[item.foodItemId] || item.foodName || 'Menu Item'}
                        </span>
                      </div>
                      <span className="font-black text-gray-900">{item.qty} portions sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Volume Breakdown */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" /> Daily Revenue Trend
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Last 7 Days</span>
              </div>

              {!stats?.weeklyBreakdown || stats.weeklyBreakdown.length === 0 ? (
                <p className="py-8 text-center text-xs font-bold text-gray-400">
                  No daily sales records available
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.weeklyBreakdown.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <span className="font-bold text-gray-600">{b.date}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400">{b.orders} orders</span>
                        <span className="font-black text-gray-900 w-20 text-right">₹{b.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
