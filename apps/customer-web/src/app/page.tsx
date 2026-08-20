'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { HeroBanner } from '../components/home/HeroBanner';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { RestaurantData, normalizeRestaurantData } from '../data/mock-data';
import { useAuthStore } from '../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';
import { useRouter } from 'next/navigation';

const API_BASE = getApiBaseUrl();

export default function CustomerHomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | 'rating' | 'deliveryTime' | 'price'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Geolocation unavailable or denied - remains null (displays "Distance unavailable")
        },
        { timeout: 5000 },
      );
    }
  }, []);

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.restaurants ?? [];
          setRestaurants(list.map((r: any) => normalizeRestaurantData(r, userLocation)));
        }
      } catch {
        // offline / error — show empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
    const interval = setInterval(fetchRestaurants, 30000); // slower polling
    return () => clearInterval(interval);
  }, [userLocation]);

  // Fetch active order (authenticated only)
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchActiveOrder = async () => {
      try {
        const { accessToken } = useAuthStore.getState();
        const headers: Record<string, string> = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
        const res = await fetch(`${API_BASE}/orders/active`, { headers });
        setActiveOrder(res.ok ? await res.json() : null);
      } catch {
        // no active order
      }
    };
    fetchActiveOrder();
  }, [isAuthenticated]);

  // Filter & sort
  let filtered = [...restaurants];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.cuisines || []).some((c) => c.toLowerCase().includes(q)),
    );
  }

  if (activeFilter === 'rating') filtered.sort((a, b) => b.avgRating - a.avgRating);
  else if (activeFilter === 'deliveryTime') filtered.sort((a, b) => (a.deliveryTimeMins || 999) - (b.deliveryTimeMins || 999));
  else if (activeFilter === 'price') filtered.sort((a, b) => (a.priceForTwo || 9999) - (b.priceForTwo || 9999));

  const skeletons = [0, 1, 2];

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">

        {/* ─── Active Order Banner ─────────────────────────── */}
        {isAuthenticated && activeOrder && (
          <div className="flex flex-col gap-3 rounded-2xl bg-orange-600 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Clock className="h-5 w-5 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-orange-200">Order #{activeOrder.orderNumber}</p>
                <p className="text-sm font-black truncate">
                  {activeOrder.driverName
                    ? `Out for delivery with ${activeOrder.driverName}`
                    : 'Your order is on its way!'}
                  {activeOrder.etaMins ? ` · ~${activeOrder.etaMins} mins` : ''}
                </p>
              </div>
            </div>
            <Link
              href={`/orders/${activeOrder.orderId}/track`}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-black text-orange-700 hover:bg-gray-100 shrink-0"
            >
              Track Order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* ─── Hero Heading ────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl lg:text-4xl">
            Order Food Online in Kashmir
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Fast food delivery from top verified restaurants, cafes, and cloud kitchens across Kashmir.
          </p>
        </div>

        {/* ─── Mobile Search Box ───────────────────────────── */}
        <div className="w-full min-w-0">
          <div
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer hover:border-orange-300 hover:bg-white transition md:hidden"
            onClick={() => router.push('/search')}
          >
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-400">Search restaurants or food</span>
          </div>
          {/* Desktop: inline search with filter */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants or food"
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* ─── Hero Banner ─────────────────────────────────── */}
        <HeroBanner />

        {/* ─── Restaurants Section ─────────────────────────── */}
        <div className="space-y-4 w-full min-w-0">
          {/* Section header + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Top Restaurants Nearby
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({filtered.length})
                </span>
              )}
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {(['all', 'rating', 'deliveryTime', 'price'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activeFilter === f
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'rating' ? '★ Top Rated' : f === 'deliveryTime' ? '⚡ Fast' : '₹ Price'}
                </button>
              ))}
            </div>
          </div>

          {/* Restaurant Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
            {isLoading
              ? skeletons.map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100 w-full" />
                ))
              : filtered.length > 0
              ? filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
              : (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-10 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-600">No restaurants found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchQuery ? 'Try a different search.' : 'Check back soon — new restaurants are joining daily.'}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
