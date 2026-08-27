'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Store, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { RestaurantData, FoodItemData, normalizeRestaurantData } from '../../data/mock-data';
import { RecommendedCard } from '../../components/home/RecommendedCard';
import { FoodCard } from '../../components/food/FoodCard';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';
import Link from 'next/link';

const API_BASE = getApiBaseUrl();

export default function FavoritesPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants');
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<string[]>([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<RestaurantData[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<FoodItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated || !accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fetch Favorite Restaurant IDs
        const res = await fetch(`${API_BASE}/users/favorites/restaurants`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const favData = await res.json();
          const ids: string[] = Array.isArray(favData) ? favData : favData.restaurantIds ?? [];
          setFavoriteRestaurantIds(ids);

          // 2. Fetch Restaurants to match details
          const restRes = await fetch(`${API_BASE}/restaurants`);
          if (restRes.ok) {
            const allRest = await restRes.json();
            const list = Array.isArray(allRest) ? allRest : allRest.restaurants ?? [];
            const normalizedList = list.map(normalizeRestaurantData);
            const favRestList = normalizedList.filter((r: RestaurantData) => ids.includes(r.id));
            setFavoriteRestaurants(favRestList);
          }
        }

        // 3. Fetch Wishlist / Favorite Dishes
        try {
          const dishRes = await fetch(`${API_BASE}/wishlist`);
          if (dishRes.ok) {
            const dishData = await dishRes.json();
            setFavoriteDishes(Array.isArray(dishData) ? dishData : dishData.items ?? []);
          }
        } catch {
          // offline
        }
      } catch (err) {
        console.error('Error loading favorites', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated, accessToken]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Heart className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sign in to view favorites</h2>
        <p className="text-xs text-gray-500">Save your favorite restaurants and dishes to easily reorder them anytime.</p>
        <Link
          href="/login?redirect=/favorites"
          className="inline-block rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-4 lg:px-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Heart className="h-5 w-5 fill-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Your Favorites</h1>
          <p className="text-xs text-gray-500">Your handpicked restaurants & dishes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'restaurants'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          Restaurants ({favoriteRestaurants.length})
        </button>
        <button
          onClick={() => setActiveTab('dishes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'dishes'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" />
          Dishes ({favoriteDishes.length})
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'restaurants' ? (
        favoriteRestaurants.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center space-y-3">
            <Store className="mx-auto h-10 w-10 text-gray-300" />
            <p className="text-base font-bold text-gray-700">No favorite restaurants yet</p>
            <p className="text-xs text-gray-400">Tap the heart icon on any restaurant to save it here for fast ordering.</p>
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
            >
              Explore restaurants <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favoriteRestaurants.map((restaurant) => (
              <RecommendedCard
                key={restaurant.id}
                restaurant={restaurant}
                isInitiallyFavorite={true}
              />
            ))}
          </div>
        )
      ) : favoriteDishes.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No favorite dishes yet</p>
          <p className="text-xs text-gray-400">Save dishes you love to reorder them with one tap.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteDishes.map((dish) => (
            <FoodCard key={dish.id} food={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
