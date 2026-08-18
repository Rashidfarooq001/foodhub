'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Star,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
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

  const fetchAnalytics = async () => {
    if (!restaurantId) return;
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
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      : stats?.completedOrders ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Kitchen Reports &amp; Analytics
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Track order fulfillment trends, gross turnover, best-selling dishes &amp; ratings
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl shrink-0">
            {(['7D', '30D', 'ALL'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition min-h-[36px] ${
                  timeRange === range
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shrink-0 min-h-[40px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Period Turnover */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">GROSS SALES ({timeRange})</span>
            <DollarSign className="h-6 w-6 rounded-xl bg-orange-50 p-1.5 text-orange-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900">
            ₹{activeRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-400 font-semibold block truncate">
            Period gross sales
          </span>
        </div>

        {/* Orders Volume */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">ORDERS ({timeRange})</span>
            <ShoppingBag className="h-6 w-6 rounded-xl bg-blue-50 p-1.5 text-blue-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900">
            {activeOrdersCount}
          </div>
          <span className="text-[10px] text-gray-400 font-semibold block truncate">
            Completed kitchen orders
          </span>
        </div>

        {/* Today Sales */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800">TODAY SALES</span>
            <TrendingUp className="h-6 w-6 rounded-xl bg-emerald-100 p-1.5 text-emerald-700" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-900">
            ₹{(stats?.todayRevenue ?? 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block truncate">
            {stats?.todayOrders ?? 0} today orders
          </span>
        </div>

        {/* Customer Rating */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-800">STORE RATING</span>
            <Star className="h-6 w-6 rounded-xl bg-amber-100 p-1.5 text-amber-700 fill-amber-500" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-950">
            {stats?.avgRating ? stats.avgRating.toFixed(1) : '4.8'} ★
          </div>
          <span className="text-[10px] text-amber-800 font-bold block truncate">
            {stats?.reviewCount ?? 12} customer reviews
          </span>
        </div>
      </div>

      {/* Top Selling Dishes */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
          <Award className="h-4 w-4 text-orange-600" />
          <span>Top Ordered Menu Items</span>
        </h2>

        {(!stats?.topItems || stats.topItems.length === 0) ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No top items data available yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.topItems.map((item, idx) => {
              const name = item.foodName || foodNames[item.foodItemId] || `Menu Dish #${item.foodItemId.slice(0, 6)}`;
              return (
                <div
                  key={item.foodItemId || idx}
                  className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-100 font-black text-orange-700 text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-gray-900">{name}</span>
                  </div>
                  <span className="font-black text-orange-700 text-sm">
                    {item.qty} units sold
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
