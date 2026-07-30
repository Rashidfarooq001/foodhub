'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DeliveryJob, DriverStats } from '../data/delivery-mock-data';
import { DollarSign, Bike, CheckCircle2, Star, ArrowRight, Navigation } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DeliveryDashboardPage() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [currentDelivery, setCurrentDelivery] = useState<DeliveryJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, deliveryRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/delivery/stats`),
          fetch(`${API_BASE}/api/v1/delivery/current`),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (deliveryRes.ok) {
          const data = await deliveryRes.json();
          setCurrentDelivery(data ?? null);
        }
      } catch {
        // Backend offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const kpi = {
    todayEarnings: stats?.todayEarnings ?? 0,
    todayDeliveries: stats?.todayDeliveries ?? 0,
    acceptanceRate: stats?.acceptanceRate ?? 0,
    avgRating: stats?.avgRating ?? 0,
    totalRatings: stats?.totalRatings ?? 0,
  };

  return (
    <div className="space-y-8">
      {/* Driver Welcome Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Courier Performance Overview</h1>
          <p className="text-xs text-gray-500">Track daily trips, earnings payouts, acceptance rates &amp; active deliveries</p>
        </div>

        <Link
          href="/current-delivery"
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
        >
          <Navigation className="h-4 w-4" /> View Active Delivery Navigation
        </Link>
      </div>

      {/* Driver Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>TODAY&apos;S EARNINGS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-emerald-600">₹{kpi.todayEarnings}</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">Includes base pay + tips</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>COMPLETED TRIPS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.todayDeliveries} Orders</h3>
          )}
          <p className="text-[10px] text-emerald-600 font-bold">100% On-Time Dispatch Rate</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>ACCEPTANCE RATE</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.acceptanceRate}%</h3>
          )}
          <p className="text-[10px] text-teal-600 font-bold">Qualifies for ₹500 Weekly Incentive</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span>RATING SCORE</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <h3 className="text-3xl font-black text-gray-900">{kpi.avgRating}/5</h3>
          )}
          <p className="text-[10px] text-gray-400 font-bold">Based on {kpi.totalRatings} ratings</p>
        </div>
      </div>

      {/* Active Trip Banner Card */}
      {!isLoading && currentDelivery && (
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase backdrop-blur-md">
                ACTIVE TRIP #{currentDelivery.orderNumber}
              </span>
              <span className="text-xs font-bold text-emerald-200">
                Payout: ₹{currentDelivery.estimatedEarnings}
              </span>
            </div>
            <span className="text-xs font-bold text-white bg-emerald-900/50 px-3 py-1 rounded-full">
              STATUS: {currentDelivery.status}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-black">{currentDelivery.restaurantName} ➔ {currentDelivery.customerName}</h3>
              <p className="text-xs text-emerald-100">{currentDelivery.customerAddress}</p>
            </div>

            <Link
              href="/current-delivery"
              className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black text-emerald-800 shadow-xl hover:bg-emerald-50"
            >
              Open GPS Navigation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
