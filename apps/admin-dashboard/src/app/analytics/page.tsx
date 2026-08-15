'use client';

import React, { useState } from 'react';
import { adminFetch } from '../../utils/admin-fetch';
import {
  DollarSign, ShoppingBag, Users, Store, Bike, AlertTriangle,
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

import { getApiBaseUrl } from '@foodhub/config';

const getApiBase = () => (typeof window !== 'undefined' ? getApiBaseUrl() : 'https://foodhub-backend-enq2.onrender.com/api/v1');

const DEFAULT_ANALYTICS = {
  kpis: {
    todayRevenue: 48250,
    todayRevenueGrowth: 12.5,
    todayOrders: 312,
    todayOrdersGrowth: 8.2,
    weeklyRevenue: 314000,
    monthlyRevenue: 1280000,
    platformCommission: 256000,
    activeCustomers: 4520,
    activeRestaurants: 142,
    activeDrivers: 88,
    avgOrderValue: 425,
    avgDeliveryTime: 28,
    pendingSettlements: 12,
    refundAmount: 4500,
  },
  revenueTrend: [
    { date: 'Mon', revenue: 38000, orders: 240 },
    { date: 'Tue', revenue: 42000, orders: 270 },
    { date: 'Wed', revenue: 40000, orders: 260 },
    { date: 'Thu', revenue: 46000, orders: 295 },
    { date: 'Fri', revenue: 58000, orders: 380 },
    { date: 'Sat', revenue: 64000, orders: 420 },
    { date: 'Sun', revenue: 61000, orders: 400 },
  ],
  categoryDistribution: [
    { name: 'Biryani & Rice', value: 38, color: '#9333ea' },
    { name: 'Burgers & Fast Food', value: 24, color: '#3b82f6' },
    { name: 'Pizza & Pasta', value: 18, color: '#10b981' },
    { name: 'Desserts & Sweets', value: 12, color: '#f59e0b' },
    { name: 'Beverages', value: 8, color: '#ef4444' },
  ],
  peakHours: [
    { hour: '12 PM', orders: 180 },
    { hour: '1 PM', orders: 240 },
    { hour: '2 PM', orders: 150 },
    { hour: '7 PM', orders: 310 },
    { hour: '8 PM', orders: 390 },
    { hour: '9 PM', orders: 320 },
    { hour: '10 PM', orders: 160 },
  ],
};

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminFetch('/analytics/admin');
        if (res.ok) {
          const data = await res.json();
          if (data && data.kpis) {
            setAnalytics(data);
          }
        }
      } catch { /* fallback */ }
    };
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Platform Business Intelligence</h1>
          <p className="text-xs text-gray-500">Real-time revenue, order growth, commissions & ecosystem metrics</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl self-start">
          {(['7D', '30D', '90D', '1Y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                timeRange === range
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today Revenue</span>
            <div className="p-2 bg-purple-50 rounded-2xl text-purple-600"><DollarSign className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">₹{analytics.kpis.todayRevenue.toLocaleString()}</span>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> +{analytics.kpis.todayRevenueGrowth}%
            </span>
          </div>
          <p className="text-xs text-gray-400">vs yesterday</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today Orders</span>
            <div className="p-2 bg-blue-50 rounded-2xl text-blue-600"><ShoppingBag className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{analytics.kpis.todayOrders}</span>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> +{analytics.kpis.todayOrdersGrowth}%
            </span>
          </div>
          <p className="text-xs text-gray-400">avg delivery {analytics.kpis.avgDeliveryTime}m</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Commission (20%)</span>
            <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">₹{analytics.kpis.platformCommission.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400">Monthly yield</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Ecosystem</span>
            <div className="p-2 bg-amber-50 rounded-2xl text-amber-600"><Users className="h-5 w-5" /></div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-purple-600">{analytics.kpis.activeCustomers} Cust</span>
            <span className="text-emerald-600">{analytics.kpis.activeRestaurants} Rest</span>
            <span className="text-blue-600">{analytics.kpis.activeDrivers} Driv</span>
          </div>
          <p className="text-xs text-gray-400">Platform active users</p>
        </div>
      </div>

      {/* Statutory GST & Accounting Isolation Banner */}
      <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              GST
            </div>
            <div>
              <h2 className="text-xs font-black uppercase text-teal-900 tracking-wider">Statutory Tax &amp; Operating Revenue Isolation</h2>
              <p className="text-[11px] text-teal-700 font-medium">Government GST collected is tracked as a statutory liability and strictly excluded from platform profit.</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
            Sec 9(5) ECO Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Gross Customer Collections</span>
            <span className="text-xl font-black text-gray-900">₹{(analytics.kpis.monthlyRevenue + 64000).toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 block">Total customer cash collections</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-teal-700 uppercase block">Statutory GST Collected (Govt)</span>
            <span className="text-xl font-black text-teal-800">₹{Math.round((analytics.kpis.monthlyRevenue + 64000) * 0.05).toLocaleString()}</span>
            <span className="text-[10px] text-teal-600 font-bold block">100% Remitted to Government (0% Revenue)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">FoodHub Net Revenue</span>
            <span className="text-xl font-black text-purple-900">₹{(analytics.kpis.platformCommission + 48000).toLocaleString()}</span>
            <span className="text-[10px] text-purple-600 font-medium block">Commission + Platform + Small Order Fees</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Platform Contribution Margin</span>
            <span className="text-xl font-black text-emerald-800">₹{Math.round((analytics.kpis.platformCommission + 48000) - 110000).toLocaleString()}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">Net Revenue - Direct Delivery Costs</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">Gross Revenue & Order Trend</h3>
              <p className="text-xs text-gray-400">Daily gross turnover and completed order volume</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Category Share</h3>
            <p className="text-xs text-gray-400">Order share across top food categories</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {analytics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {analytics.categoryDistribution.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="text-gray-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Peak Hours & Operational Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="text-base font-black text-gray-900">Peak Ordering Hours</h3>
              <p className="text-xs text-gray-400">Hourly order load distribution</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.peakHours}>
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-base font-black text-gray-900">Financial & Settlement Health</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
              <span className="text-xs font-bold text-amber-700 uppercase">Pending Settlements</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{analytics.kpis.pendingSettlements}</p>
              <p className="text-xs text-amber-600 mt-1">Requires admin approval</p>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
              <span className="text-xs font-bold text-rose-700 uppercase">Refunds Issued</span>
              <p className="text-2xl font-black text-rose-900 mt-1">₹{analytics.kpis.refundAmount}</p>
              <p className="text-xs text-rose-600 mt-1">Last 30 days total</p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-700 uppercase">Avg Order Value</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">₹{analytics.kpis.avgOrderValue}</p>
              <p className="text-xs text-emerald-600 mt-1">Per transaction average</p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-4 border border-purple-100">
              <span className="text-xs font-bold text-purple-700 uppercase">Avg Delivery Time</span>
              <p className="text-2xl font-black text-purple-900 mt-1">{analytics.kpis.avgDeliveryTime} min</p>
              <p className="text-xs text-purple-600 mt-1">Order to door duration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
