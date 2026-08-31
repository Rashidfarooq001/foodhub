'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Award, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

export default function DeliveryRatingsPage() {
  const { accessToken } = useDeliveryAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/stats`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) setStats(await res.json());
    } catch {
      /* backend offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [accessToken]);

  const reviews = [
    { id: 'r1', customer: 'Rahul Sharma', rating: 5, comment: 'Polite driver, delivered piping hot food in 15 mins!', time: 'Yesterday' },
    { id: 'r2', customer: 'Priya Patel', rating: 5, comment: 'Handled packaging with great care.', time: '3 days ago' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Courier Ratings &amp; Compliments
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Customer feedback scores, delivery badges &amp; performance ratings
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overall Score Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">OVERALL COURIER SCORE</span>
            <div className="text-3xl sm:text-4xl font-black text-amber-950 flex items-center gap-2 mt-1">
              {stats?.avgRating !== null && stats?.avgRating !== undefined ? stats.avgRating.toFixed(1) : 'N/A'}
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-amber-800 font-bold mt-1">
              {stats?.avgRating !== null && stats?.avgRating !== undefined ? 'Top-Rated Fleet Partner on ZaykaFood' : 'Complete deliveries to get ratings'}
            </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
          <Award className="h-6 w-6" />
        </div>
      </div>

      {/* Customer Compliments */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Recent Delivery Feedback
        </h2>

        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-black text-gray-900">{rev.customer}</span>
              <span className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-black text-amber-800">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {rev.rating}.0
              </span>
            </div>
            <p className="text-xs text-gray-700 font-medium">{rev.comment}</p>
            <span className="text-[10px] text-gray-400 font-medium block">{rev.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
