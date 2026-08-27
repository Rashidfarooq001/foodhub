'use client';

import React, { useState, useEffect } from 'react';
import { RestaurantData, normalizeRestaurantData } from '../../data/mock-data';
import { RestaurantCard } from '../../components/restaurant/RestaurantCard';
import { Search, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AllRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'deliveryTime' | 'price'>('rating');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.restaurants ?? [];
          setRestaurants(list.map(normalizeRestaurantData));
        }
      } catch {
        /* offline */
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
    const interval = setInterval(fetchRestaurants, 5000);
    return () => clearInterval(interval);
  }, []);

  // Extract all unique cuisines
  const allCuisines = ['All', ...Array.from(new Set(restaurants.flatMap((r) => r.cuisines)))];

  // Filter & Sort logic
  const filtered = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisines.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCuisine = selectedCuisine === 'All' || (Array.isArray(r.cuisines) && r.cuisines.includes(selectedCuisine));
    return matchesSearch && matchesCuisine;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.avgRating - a.avgRating;
    if (sortBy === 'deliveryTime') return (a.deliveryTimeMins || 999) - (b.deliveryTimeMins || 999);
    if (sortBy === 'price') return (a.priceForTwo || 9999) - (b.priceForTwo || 9999);
    return 0;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3.5 py-1 text-xs font-black text-orange-700">
          <Sparkles className="h-3.5 w-3.5" /> LIVE RESTAURANT DIRECTORY
        </div>
        <h1 className="text-3xl font-black text-gray-900">Explore All Onboarded Restaurants</h1>
        <p className="text-xs text-gray-500">
          Discover verified partner kitchens, authentic cuisines &amp; fast doorstep delivery.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by restaurant name or cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Cuisine Filter & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-white py-2.5 px-3 text-xs font-bold text-gray-800 shadow-sm focus:border-orange-500 focus:outline-none"
            >
              {allCuisines.map((c) => (
                <option key={c} value={c}>
                  Cuisine: {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-2xl border border-gray-200 bg-white py-2.5 px-3 text-xs font-bold text-gray-800 shadow-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="rating">Sort: Top Rated</option>
              <option value="deliveryTime">Sort: Fastest Delivery</option>
              <option value="price">Sort: Price (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center space-y-3 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No restaurants match your search</h3>
          <p className="text-xs text-gray-500">
            Try clearing filters or searching for a different cuisine keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
