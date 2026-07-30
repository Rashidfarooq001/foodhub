'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroBanner } from '../components/home/HeroBanner';
import { CategorySlider } from '../components/home/CategorySlider';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { FoodCard } from '../components/food/FoodCard';
import { RestaurantData, FoodItemData, ActiveOrderTrackingData } from '../data/mock-data';
import { useSettingsStore } from '../stores/use-settings-store';
import { useAuthStore } from '../stores/use-auth-store';
import { Sparkles, Clock, ArrowRight, Flame } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CustomerHomePage() {
  const { isVegOnly } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'rating' | 'deliveryTime' | 'price'>('all');

  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/restaurants`);
        if (res.ok) {
          const data = await res.json();
          setRestaurants(Array.isArray(data) ? data : data.restaurants ?? []);
        }
      } catch {
        // Backend offline — show empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchActiveOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/orders/active`);
        if (res.ok) {
          const data = await res.json();
          setActiveOrder(data ?? null);
        }
      } catch {
        // No active order
      }
    };
    fetchActiveOrder();
  }, [isAuthenticated]);

  // Filter and sort restaurants
  let filteredRestaurants = [...restaurants];
  if (isVegOnly) {
    filteredRestaurants = filteredRestaurants.filter((r) =>
      r.foodItems?.some((f) => f.isVeg),
    );
  }
  if (activeFilter === 'rating') {
    filteredRestaurants.sort((a, b) => b.avgRating - a.avgRating);
  } else if (activeFilter === 'deliveryTime') {
    filteredRestaurants.sort((a, b) => a.deliveryTimeMins - b.deliveryTimeMins);
  } else if (activeFilter === 'price') {
    filteredRestaurants.sort((a, b) => a.priceForTwo - b.priceForTwo);
  }

  const allFoodItems: FoodItemData[] = restaurants.flatMap((r) => r.foodItems ?? []);

  const skeletonCards = Array.from({ length: 3 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Active Order Live Banner (Only for Authenticated Users with Active Orders) */}
      {isAuthenticated && activeOrder && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 p-5 text-white shadow-xl sm:flex-row sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/30 px-2.5 py-0.5 text-[10px] font-black uppercase">
                  Order {activeOrder.orderNumber}
                </span>
                <span className="text-xs font-bold text-amber-200">
                  Arriving in {activeOrder.etaMins} mins
                </span>
              </div>
              <p className="text-base font-black">Out For Delivery with {activeOrder.driverName}</p>
            </div>
          </div>
          <Link
            href={`/orders/${activeOrder.orderId}/track`}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-black text-orange-700 shadow-md hover:bg-gray-100"
          >
            Track Live Map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Hero Banner Carousel */}
      <HeroBanner />

      {/* Food Categories Slider */}
      <CategorySlider />

      {/* Restaurants Section */}
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Top Restaurants Nearby {isLoading ? '' : `(${filteredRestaurants.length})`}
            </h2>
            <p className="text-xs text-gray-500">Handpicked kitchens with fast 30-min dispatch</p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'rating', 'deliveryTime', 'price'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  activeFilter === f
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'rating' ? '★ Top Rated' : f === 'deliveryTime' ? '⚡ Fast Delivery' : '₹ Cost Low-High'}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? skeletonCards.map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl bg-gray-100" />
              ))
            : filteredRestaurants.length > 0
            ? filteredRestaurants.map((rest) => (
                <RestaurantCard key={rest.id} restaurant={rest} />
              ))
            : (
              <div className="col-span-3 rounded-3xl border border-gray-100 bg-white p-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-base font-bold text-gray-700">No restaurants found nearby</p>
                <p className="text-xs text-gray-400 mt-1">Check back soon — new restaurants are joining FoodHub daily.</p>
              </div>
            )}
        </div>
      </div>

      {/* Featured Food Items Section */}
      {allFoodItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Flame className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Trending Bestsellers</h2>
              <p className="text-xs text-gray-500">Most ordered dishes in your locality right now</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {allFoodItems.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
