'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { DriverStats } from '../../data/delivery-mock-data';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DeliveryRatingsPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/delivery/stats`);
        if (res.ok) setStats(await res.json());
      } catch { /* backend offline */ }
    };
    fetchStats();
  }, []);

  const reviews = [
    { id: 'r1', customer: 'Rahul Sharma', rating: 5, comment: 'Polite driver, delivered piping hot food in 15 mins!', time: 'Yesterday' },
    { id: 'r2', customer: 'Priya Patel', rating: 5, comment: 'Handled packaging with great care.', time: '3 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Courier Ratings & Badges</h1>
        <p className="text-xs text-gray-500">Customer feedback scores and performance compliments</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-400">YOUR OVERALL SCORE</span>
          <h2 className="text-4xl font-black text-gray-900 flex items-center gap-2">
            {stats?.avgRating ?? '--'} <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
          </h2>
          <p className="text-xs text-emerald-600 font-bold">Top 5% Courier Partner in Bengaluru</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((rev) => (
          <div key={rev.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">{rev.customer}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                <Star className="h-4 w-4 fill-amber-400" /> {rev.rating}/5
              </span>
            </div>
            <p className="text-xs text-gray-600">{rev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
