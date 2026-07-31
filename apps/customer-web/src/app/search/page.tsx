'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { RestaurantData, FoodItemData, normalizeRestaurantData } from '../../data/mock-data';
import { RestaurantCard } from '../../components/restaurant/RestaurantCard';
import { FoodCard } from '../../components/food/FoodCard';
import { EmptyState } from '../../components/common/LoadingSkeleton';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'dishes' | 'restaurants'>('all');
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants?approvedOnly=true`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.restaurants ?? [];
          setRestaurants(list.map(normalizeRestaurantData));
        }
      } catch { /* offline */ }
    };
    fetchRestaurants();
    const interval = setInterval(fetchRestaurants, 8000);
    return () => clearInterval(interval);
  }, []);

  const allFoodItems: FoodItemData[] = restaurants.flatMap((r: RestaurantData) => r.foodItems ?? []);

  const filteredRestaurants = query.trim()
    ? restaurants.filter(
        (r: RestaurantData) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.cuisines?.some((c: string) => c.toLowerCase().includes(query.toLowerCase())),
      )
    : [];

  const filteredFood = query.trim()
    ? allFoodItems.filter((f: FoodItemData) => f.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const popularTags = ['Biryani', 'Paneer Butter Masala', 'Pizza', 'Garlic Naan', 'Burger', 'Chinese'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Search Header Input */}
      <div className="relative mx-auto max-w-2xl">
        <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for restaurants, dishes, or cuisines..."
          className="w-full rounded-3xl border-2 border-gray-200 bg-white py-4 pl-14 pr-12 text-base font-bold text-gray-900 shadow-md focus:border-orange-500 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Popular Search Suggestions */}
      {!query && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Popular Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:border-orange-500 hover:text-orange-600 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query.trim() && (
        <div className="space-y-6">
          {/* Tab Filter */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            {(['all', 'dishes', 'restaurants'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${
                  activeTab === tab
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab} ({tab === 'all' ? filteredRestaurants.length + filteredFood.length : tab === 'restaurants' ? filteredRestaurants.length : filteredFood.length})
              </button>
            ))}
          </div>

          {filteredRestaurants.length === 0 && filteredFood.length === 0 ? (
            <EmptyState
              title={`No results found for "${query}"`}
              subtitle="Try searching for another dish or restaurant name."
            />
          ) : (
            <div className="space-y-8">
              {(activeTab === 'all' || activeTab === 'restaurants') && filteredRestaurants.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Matching Restaurants</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRestaurants.map((r: RestaurantData) => (
                      <RestaurantCard key={r.id} restaurant={r} />
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'dishes') && filteredFood.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Matching Dishes</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {filteredFood.map((f: FoodItemData) => (
                      <FoodCard key={f.id} food={f} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
