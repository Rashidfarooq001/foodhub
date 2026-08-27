'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CategoryData, RestaurantData, normalizeRestaurantData } from '../../../data/mock-data';
import { RestaurantCard } from '../../../components/restaurant/RestaurantCard';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, restRes] = await Promise.all([
          fetch(`${API_BASE}/categories/${categoryId}`),
          fetch(`${API_BASE}/restaurants`),
        ]);
        if (catRes.ok) setCategory(await catRes.json());
        if (restRes.ok) {
          const data = await restRes.json();
          const list = Array.isArray(data) ? data : data.restaurants ?? [];
          setRestaurants(list.map(normalizeRestaurantData));
        }
      } catch { /* backend offline */ } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [categoryId]);

  const displayName = category?.name ?? categoryId;
  const displayImage = category?.image ?? '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
      {/* Category Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white p-5 sm:p-12 shadow-xl">
        <div className="relative z-10 space-y-2">
          <span className="rounded-full bg-orange-500/30 px-3 py-1 text-xs font-bold text-orange-300">
            CUISINE CATEGORY
          </span>
          <h1 className="text-4xl font-black">{displayName}</h1>
          <p className="max-w-md text-xs text-gray-300">
            Top rated kitchens serving authentic {displayName} near your current location.
          </p>
        </div>
        {displayImage && (
          <img
            src={displayImage}
            alt={displayName}
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30"
          />
        )}
      </div>

      {/* Restaurants serving category */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">
          Restaurants serving {displayName}
        </h3>
        <div className="grid grid-rows-2 grid-flow-col gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] auto-cols-[calc(42vw)] sm:auto-cols-[calc(30vw)] md:auto-cols-[calc(24vw)] lg:auto-cols-[calc(20vw)] xl:auto-cols-[calc(16vw)]">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="snap-start h-72 animate-pulse rounded-2xl bg-gray-100" />
              ))
            : restaurants.length > 0
            ? restaurants.map((r: RestaurantData) => (
                <div className="snap-start"><RestaurantCard key={r.id} restaurant={r} /></div>
              ))
            : (
              <div className="col-span-3 rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
                No restaurants found in this category.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
