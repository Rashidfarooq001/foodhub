'use client';

import React, { useState, useEffect } from 'react';
import { FoodItemData } from '../../data/mock-data';
import { FoodCard } from '../../components/food/FoodCard';
import { Heart } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function WishlistPage() {
  const [wishlistedItems, setWishlistedItems] = useState<FoodItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/wishlist`);
        if (res.ok) {
          const data = await res.json();
          setWishlistedItems(Array.isArray(data) ? data : data.items ?? []);
        }
      } catch { /* offline */ } finally {
        setIsLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Heart className="h-5 w-5 fill-rose-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Your Favorites</h1>
          <p className="text-xs text-gray-500">Saved dishes for quick reordering</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      ) : wishlistedItems.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          No favorite items saved yet. Click the heart icon on any dish to add it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {wishlistedItems.map((food: FoodItemData) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
}
