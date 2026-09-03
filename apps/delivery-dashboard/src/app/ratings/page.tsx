'use client';

import React, { useState, useEffect } from 'react';
import { Star, Award, RefreshCw, BarChart2 } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

export default function DeliveryRatingsPage() {
  const { accessToken } = useDeliveryAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [ratingsData, setRatingsData] = useState<{average: number, total: number, distribution: Record<string, number>} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const [statsRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/delivery/stats`, { headers }),
        fetch(`${API_BASE}/delivery/ratings`, { headers })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (reviewsRes.ok) setRatingsData(await reviewsRes.json());
    } catch {
      /* backend offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Courier Ratings & Performance
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Customer feedback scores & delivery badges
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
            OVERALL COURIER SCORE
          </span>
          <div className="text-3xl sm:text-4xl font-black text-amber-950 flex items-center gap-2 mt-1">
            {stats?.avgRating !== null && stats?.avgRating !== undefined
              ? stats.avgRating.toFixed(1)
              : 'N/A'}
            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-xs text-amber-800 font-bold mt-1">
            {stats?.avgRating !== null && stats?.avgRating !== undefined
              ? 'Top-Rated Fleet Partner on ZaykaFood'
              : 'Complete deliveries to get ratings'}
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
          <Award className="h-6 w-6" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-gray-500" />
          Rating Distribution
        </h2>

        {!ratingsData || ratingsData.total === 0 ? (
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center text-xs text-gray-500 font-bold">
            No ratings yet
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingsData.distribution[star.toString()] || 0;
              const percentage = ratingsData.total > 0 ? (count / ratingsData.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-sm font-black text-gray-900">{star}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-right text-xs font-bold text-gray-500">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
