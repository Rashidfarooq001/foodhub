'use client';

import React from 'react';
import { DollarSign, CheckCircle2, Star, Navigation, Award } from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';

const getApiBase = () => (typeof window !== 'undefined' ? getApiBaseUrl() : 'https://foodhub-backend-enq2.onrender.com/api/v1');

const DEFAULT_ANALYTICS: any = {
  todayEarnings: 0,
  todayDeliveries: 0,
  weeklyEarnings: 0,
  monthlyEarnings: 0,
  completionRate: null,
  acceptanceRate: null,
  avgRating: null,
  distanceCoveredKm: 0,
  tipsEarned: 0,
};

export default function DriverAnalyticsPage() {
  const [analytics, setAnalytics] = React.useState(DEFAULT_ANALYTICS);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_delivery_token') : null;
        const res = await fetch(`${getApiBase()}/delivery/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.todayEarnings !== undefined) {
            setAnalytics(data);
          }
        }
      } catch { /* fallback */ }
    };
    fetchStats();
  }, []);
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Performance & Earnings Analytics</h1>
        <p className="text-xs text-gray-500">Track delivery stats, acceptance rate, customer ratings and distance covered</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Today Earnings</span>
            <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-600"><DollarSign className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">₹{analytics.todayEarnings}</p>
          <p className="text-xs text-gray-400">{analytics.todayDeliveries} completed trips</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
            <span>Monthly Earnings</span>
            <div className="p-2 bg-purple-50 rounded-2xl text-purple-600"><Award className="h-4 w-4" /></div>
          </div>
          <p className="text-2xl font-black text-gray-900">₹{analytics.monthlyEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Includes ₹{analytics.tipsEarned} in tips</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
              <span>Completion Rate</span>
              <div className="p-2 bg-blue-50 rounded-2xl text-blue-600 shrink-0"><CheckCircle2 className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {analytics.completionRate !== null && analytics.completionRate !== undefined ? `${analytics.completionRate}%` : 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {analytics.acceptanceRate !== null && analytics.acceptanceRate !== undefined ? `${analytics.acceptanceRate}% acceptance rate` : 'No deliveries yet'}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
              <span>Driver Rating</span>
              <div className="p-2 bg-amber-50 rounded-2xl text-amber-500 shrink-0"><Star className="h-4 w-4 fill-amber-400" /></div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {analytics.avgRating !== null && analytics.avgRating !== undefined ? `${Number(analytics.avgRating).toFixed(1)} / 5.0` : 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {analytics.distanceCoveredKm > 0 ? `${analytics.distanceCoveredKm} km total distance` : 'No distance recorded'}
          </p>
        </div>
      </div>
    </div>
  );
}
