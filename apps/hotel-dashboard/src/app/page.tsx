'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { KitchenOrderItem, RestaurantStats } from '../data/hotel-mock-data';
import { useKitchenStore } from '../stores/use-kitchen-store';
import { DollarSign, ShoppingBag, Clock, Star, ArrowUpRight, UtensilsCrossed } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function HotelDashboardPage() {
  const { queue, setQueue } = useKitchenStore();
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/analytics/restaurant`),
          fetch(`${API_BASE}/api/v1/orders?status=PENDING,PREPARING`),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setQueue(Array.isArray(data) ? data : data.orders ?? []);
        }
      } catch {
        // Backend offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [setQueue]);

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

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Kitchen Overview</h1>
          <p className="text-xs text-gray-500">Live order queue, revenue metrics &amp; performance analytics</p>
        </div>

        <Link
          href="/kitchen-queue"
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700"
        >
          <UtensilsCrossed className="h-4 w-4" /> Open KDS Display System
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY&apos;S REVENUE</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">₹{kpi.todayRevenue.toLocaleString()}</h3>
          )}
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> +14.2% vs yesterday
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY&apos;S ORDERS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.todayOrders}</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">
            {kpi.completedOrders} completed • {kpi.cancelledOrders} cancelled
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>ACTIVE KITCHEN QUEUE</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-blue-600">{kpi.pendingOrders}</h3>
          )}
          <p className="text-[10px] text-blue-600 font-bold">Orders being prepared now</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>AVERAGE RATING</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.avgRating}</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">Based on {kpi.totalReviews} reviews</p>
        </div>
      </div>

      {/* Sales Graph & Recent Orders */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Weekly Revenue Graph */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Weekly Revenue Trend</h3>
            <span className="text-xs font-bold text-gray-400">Last 7 Days</span>
          </div>

          <div className="h-72 w-full pt-4">
            {isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-gray-50" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.weeklyRevenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Active Queue Preview */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Active Live Orders</h3>
            <Link href="/kitchen-queue" className="text-xs font-bold text-orange-600 hover:underline">
              View KDS →
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)
            ) : queue.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No active orders in queue</p>
            ) : (
              queue.map((order: KitchenOrderItem) => (
                <div key={order.id} className="rounded-2xl border border-gray-100 p-4 space-y-2 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-900">{order.orderNumber}</span>
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black text-orange-800">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-800">{order.customerName}</p>
                  <p className="text-[11px] text-gray-500">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  <div className="flex justify-between items-center pt-2 text-[10px] text-gray-400 border-t border-gray-200">
                    <span>Placed: {order.placedAt}</span>
                    <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
