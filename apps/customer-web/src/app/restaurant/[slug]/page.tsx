'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RestaurantData, FoodItemData } from '../../../data/mock-data';
import { FoodCard } from '../../../components/food/FoodCard';
import { Star, Clock, MapPin, Search, ShieldCheck, Tag, X, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../../stores/use-cart-store';
import Link from 'next/link';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function RestaurantDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedFoodForCustomization, setSelectedFoodForCustomization] = useState<FoodItemData | null>(null);

  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurant();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-80 animate-pulse rounded-3xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center space-y-4">
          <p className="text-2xl font-black text-gray-800">Restaurant Not Found</p>
          <p className="text-sm text-gray-400">The restaurant you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredItems = (restaurant.foodItems ?? []).filter((f) =>
    f.name.toLowerCase().includes(menuSearch.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Restaurant Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-2xl">
        <div className="h-64 w-full relative">
          <img
            src={restaurant.bannerUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        </div>

        <div className="relative -mt-20 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  OPEN NOW
                </span>
                {restaurant.discountBadge && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                    <Tag className="h-3 w-3" /> {restaurant.discountBadge}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">{restaurant.name}</h1>
              <p className="text-xs text-gray-300">{restaurant.cuisines?.join(' • ')}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" /> {restaurant.address}
              </p>
            </div>

            {/* Rating Box */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
              <div>
                <div className="flex items-center gap-1 text-base font-black text-amber-400">
                  <Star className="h-5 w-5 fill-amber-400" />
                  <span>{restaurant.avgRating}</span>
                </div>
                <p className="text-[10px] text-gray-300">{restaurant.ratingCount}+ ratings</p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="flex items-center gap-1 text-base font-black text-white">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <span>{restaurant.deliveryTimeMins}m</span>
                </div>
                <p className="text-[10px] text-gray-300">{restaurant.distanceKm} km</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>FSSAI License No: {restaurant.fssaiLicense}</span>
          </div>
        </div>
      </div>

      {/* Menu Search Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Recommended Menu ({filteredItems.length})
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search within menu..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Menu Dishes Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredItems.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onCustomize={(f) => setSelectedFoodForCustomization(f)}
          />
        ))}
      </div>

      {/* Food Customization Modal */}
      {selectedFoodForCustomization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Customize {selectedFoodForCustomization.name}
                </h3>
                <p className="text-xs text-gray-500">Select portion size and extra toppings</p>
              </div>
              <button
                onClick={() => setSelectedFoodForCustomization(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Addons List */}
            {selectedFoodForCustomization.addonGroups?.map((group) => (
              <div key={group.id} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {group.groupName}
                </h4>
                <div className="space-y-2">
                  {group.addons.map((addon) => (
                    <label
                      key={addon.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-orange-50/50"
                    >
                      <span className="text-xs font-bold text-gray-800">{addon.name}</span>
                      <span className="text-xs font-black text-orange-600">+₹{addon.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                addItem({
                  foodItemId: selectedFoodForCustomization.id,
                  name: selectedFoodForCustomization.name,
                  price: selectedFoodForCustomization.price,
                  imageUrl: selectedFoodForCustomization.imageUrl,
                  isVeg: selectedFoodForCustomization.isVeg,
                  restaurantId: selectedFoodForCustomization.restaurantId,
                  restaurantName: selectedFoodForCustomization.restaurantName,
                  addons: selectedFoodForCustomization.addonGroups?.[0]?.addons || [],
                });
                setSelectedFoodForCustomization(null);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700"
            >
              Add Item to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
