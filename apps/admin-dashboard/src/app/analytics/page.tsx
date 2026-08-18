'use client';

import React, { useState, useEffect } from 'react';
import { adminFetch } from '../../utils/admin-fetch';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Bike,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Platform Intelligence &amp; Analytics
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Real-time GMV turnover, unit economics, statutory GST &amp; demand load
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl shrink-0">
            {(['7D', '30D', '90D', '1Y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition min-h-[36px] ${
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
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shrink-0 min-h-[40px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Stat Cards: 2-column on mobile, 4-column on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Today Revenue */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">TODAY GMV</span>
            <DollarSign className="h-6 w-6 rounded-xl bg-purple-50 p-1.5 text-purple-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900">
            ₹{kpis.todayRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-400 font-semibold block truncate">
            Today gross sales
          </span>
        </div>

        {/* Today Orders */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">TODAY ORDERS</span>
            <ShoppingBag className="h-6 w-6 rounded-xl bg-blue-50 p-1.5 text-blue-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-gray-900">
            {kpis.todayOrders}
          </div>
          <span className="text-[10px] text-gray-400 font-semibold block truncate">
            Platform volume
          </span>
        </div>

        {/* Commission */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800">COMMISSION ({timeRange})</span>
            <TrendingUp className="h-6 w-6 rounded-xl bg-emerald-100 p-1.5 text-emerald-700" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-900">
            ₹{kpis.platformCommission.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block truncate">
            Net take-rate income
          </span>
        </div>

        {/* Ecosystem */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-800">ECOSYSTEM</span>
            <Users className="h-6 w-6 rounded-xl bg-amber-100 p-1.5 text-amber-700" />
          </div>
          <div className="text-sm sm:text-base font-black text-amber-950 pt-0.5 space-y-0.5">
            <div>{kpis.activeRestaurants} Stores</div>
            <div className="text-[11px] text-amber-800 font-bold">{kpis.onlineDrivers} Riders Online</div>
          </div>
        </div>
      </div>

      {/* Statutory GST & Accounting Isolation */}
      <div className="rounded-2xl sm:rounded-3xl border border-teal-200 bg-teal-50/50 p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
          <div>
            <h2 className="text-xs font-black uppercase text-teal-900 tracking-wider">
              Statutory Tax &amp; Operating Isolation ({timeRange})
            </h2>
            <p className="text-[10px] sm:text-[11px] text-teal-700">
              Government GST strictly segregated from platform revenue
            </p>
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-teal-800 bg-teal-100 px-2.5 py-1 rounded-xl border border-teal-300">
            Sec 9(5) ECO
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-teal-100 space-y-0.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase block">Gross Collections</span>
            <span className="text-base sm:text-lg font-black text-gray-900">₹{kpis.periodRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-teal-100 space-y-0.5">
            <span className="text-[9px] font-bold text-teal-700 uppercase block">Statutory GST</span>
            <span className="text-base sm:text-lg font-black text-teal-800">₹{kpis.statutoryGst.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-teal-100 space-y-0.5">
            <span className="text-[9px] font-bold text-purple-700 uppercase block">Net Revenue</span>
            <span className="text-base sm:text-lg font-black text-purple-900">₹{kpis.foodhubNetRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-teal-100 space-y-0.5">
            <span className="text-[9px] font-bold text-emerald-700 uppercase block">Contribution Margin</span>
            <span className="text-base sm:text-lg font-black text-emerald-800">₹{kpis.platformContributionMargin.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Main Charts: Revenue Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-gray-900">
              Gross Revenue &amp; Order Trend ({timeRange})
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-400">Daily gross turnover and completed order volume</p>
          </div>
          <div className="h-56 sm:h-72 w-full">
            {revenueTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">
                No revenue records in selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black text-gray-900">Category Share</h3>
            <p className="text-[10px] sm:text-xs text-gray-400">Order turnover across food categories</p>
          </div>
          <div className="h-48 sm:h-56 w-full">
            {categoryDistribution.length === 0 || categoryDistribution.every((c) => c.value === 0) ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">
                No category sales recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1 pt-2">
            {categoryDistribution.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-700 truncate">{cat.name}</span>
                </div>
                <span className="text-gray-900 font-bold">₹{cat.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Ordering Hours Bar Chart */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-gray-900">Peak Ordering Hours</h3>
          <p className="text-[10px] sm:text-xs text-gray-400">Hourly order load distribution across peak lunch and dinner hours</p>
        </div>
        <div className="h-52 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours}>
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip />
              <Bar dataKey="orders" fill="#9333ea" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
