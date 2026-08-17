'use client';

import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../utils/admin-fetch';
import {
  DollarSign, ShoppingBag, Users, Store, Bike, AlertTriangle,
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsData {
  range: string;
  kpis: {
    todayRevenue: number;
    todayRevenueGrowth: number;
    todayOrders: number;
    todayOrdersGrowth: number;
    periodRevenue: number;
    platformCommission: number;
    platformFees: number;
    deliveryFees: number;
    foodhubNetRevenue: number;
    platformContributionMargin: number;
    activeCustomers: number;
    activeRestaurants: number;
    activeDrivers: number;
    onlineDrivers: number;
    avgOrderValue: number;
    avgDeliveryTime: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    refundAmount: number;
    statutoryGst: number;
  };
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
  peakHours: Array<{ hour: string; orders: number }>;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/analytics/admin?range=${timeRange}`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.statusText}`);
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform business intelligence');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const kpis = analytics?.kpis || {
    todayRevenue: 0,
    todayRevenueGrowth: 0,
    todayOrders: 0,
    todayOrdersGrowth: 0,
    periodRevenue: 0,
    platformCommission: 0,
    platformFees: 0,
    deliveryFees: 0,
    foodhubNetRevenue: 0,
    platformContributionMargin: 0,
    activeCustomers: 0,
    activeRestaurants: 0,
    activeDrivers: 0,
    onlineDrivers: 0,
    avgOrderValue: 0,
    avgDeliveryTime: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    refundAmount: 0,
    statutoryGst: 0,
  };

  const revenueTrend = analytics?.revenueTrend || [];
  const categoryDistribution = analytics?.categoryDistribution || [];
  const peakHours = analytics?.peakHours || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Platform Business Intelligence</h1>
          <p className="text-xs text-gray-500">Live revenue, order growth, commissions &amp; ecosystem metrics from PostgreSQL</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
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

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today Revenue</span>
            <div className="p-2 bg-purple-50 rounded-2xl text-purple-600"><DollarSign className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">₹{kpis.todayRevenue.toLocaleString('en-IN')}</span>
            {kpis.todayRevenueGrowth !== 0 && (
              <span className={`flex items-center text-xs font-bold ${kpis.todayRevenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpis.todayRevenueGrowth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {kpis.todayRevenueGrowth > 0 ? `+${kpis.todayRevenueGrowth}%` : `${kpis.todayRevenueGrowth}%`}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Authoritative today sales</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today Orders</span>
            <div className="p-2 bg-blue-50 rounded-2xl text-blue-600"><ShoppingBag className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{kpis.todayOrders}</span>
            {kpis.todayOrdersGrowth !== 0 && (
              <span className={`flex items-center text-xs font-bold ${kpis.todayOrdersGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpis.todayOrdersGrowth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {kpis.todayOrdersGrowth > 0 ? `+${kpis.todayOrdersGrowth}%` : `${kpis.todayOrdersGrowth}%`}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Total orders initiated today</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Commission ({timeRange})</span>
            <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">₹{kpis.platformCommission.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-gray-400">Sum of order commission snapshots</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Ecosystem</span>
            <div className="p-2 bg-amber-50 rounded-2xl text-amber-600"><Users className="h-5 w-5" /></div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-purple-600">{kpis.activeCustomers} Cust</span>
            <span className="text-emerald-600">{kpis.activeRestaurants} Rest</span>
            <span className="text-blue-600">{kpis.onlineDrivers} Online / {kpis.activeDrivers} Driv</span>
          </div>
          <p className="text-xs text-gray-400">Live PostgreSQL directory counts</p>
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
              <h2 className="text-xs font-black uppercase text-teal-900 tracking-wider">Statutory Tax &amp; Operating Revenue Isolation ({timeRange})</h2>
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
            <span className="text-xl font-black text-gray-900">₹{kpis.periodRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-gray-400 block">Total customer cash collections in {timeRange}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-teal-700 uppercase block">Statutory GST Collected (Govt)</span>
            <span className="text-xl font-black text-teal-800">₹{kpis.statutoryGst.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-teal-600 font-bold block">100% Remitted to Government (0% Revenue)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">ZaykaFood Net Revenue</span>
            <span className="text-xl font-black text-purple-900">₹{kpis.foodhubNetRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-purple-600 font-medium block">Commission + Platform Fee (₹3)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Platform Contribution Margin</span>
            <span className="text-xl font-black text-emerald-800">₹{kpis.platformContributionMargin.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">Net Revenue + Delivery Fee - Rider Cost</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">Gross Revenue &amp; Order Trend ({timeRange})</h3>
              <p className="text-xs text-gray-400">Daily gross turnover and completed order volume</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {revenueTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">
                No revenue records in selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
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
            )}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">Category Share</h3>
            <p className="text-xs text-gray-400">Order turnover across food categories</p>
          </div>
          <div className="h-56 w-full">
            {categoryDistribution.length === 0 || categoryDistribution.every(c => c.value === 0) ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">
                No category sales recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1.5">
            {categoryDistribution.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-700">{cat.name}</span>
                </div>
                <span className="text-gray-900 font-bold">₹{cat.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Ordering Hours Bar Chart */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-gray-900">Peak Ordering Hours</h3>
          <p className="text-xs text-gray-400">Hourly order load distribution across peak lunch and dinner hours</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours}>
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Bar dataKey="orders" fill="#9333ea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
