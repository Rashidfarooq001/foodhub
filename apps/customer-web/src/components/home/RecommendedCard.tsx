'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Heart, Clock, MapPin } from 'lucide-react';
import { RestaurantData } from '../../data/mock-data';
import { getImageUrl, getApiBaseUrl } from '@foodhub/config';
import { useAuthStore } from '../../stores/use-auth-store';

const API_BASE = getApiBaseUrl();

interface Props {
  restaurant: RestaurantData;
  isInitiallyFavorite?: boolean;
}

export const RecommendedCard: React.FC<Props> = ({ restaurant, isInitiallyFavorite = false }) => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(isInitiallyFavorite);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !accessToken) {
      setIsFavorite(!isFavorite);
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      const nextState = !isFavorite;
      setIsFavorite(nextState);

      const method = nextState ? 'POST' : 'DELETE';
      await fetch(`${API_BASE}/users/favorites/restaurants/${restaurant.id}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('Failed to toggle favorite on backend', err);
    } finally {
      setIsToggling(false);
    }
  };

  const rating =
    restaurant.avgRating && restaurant.avgRating > 0
      ? restaurant.avgRating.toFixed(1)
      : null;

  const deliveryTime =
    restaurant.deliveryTimeMins && restaurant.deliveryTimeMins > 0
      ? `${restaurant.deliveryTimeMins} mins`
      : null;

  const distanceText =
    restaurant.distanceKm !== undefined && restaurant.distanceKm !== null && restaurant.distanceKm > 0
      ? `${restaurant.distanceKm.toFixed(1)} km`
      : null;

  const priceText =
    restaurant.priceForTwo && restaurant.priceForTwo > 0
      ? `₹${restaurant.priceForTwo} for two`
      : null;

  const cuisineText =
    restaurant.cuisines && restaurant.cuisines.length > 0
      ? restaurant.cuisines.slice(0, 2).join(', ')
      : null;

  const imageSrc = restaurant.bannerUrl || restaurant.logoUrl
    ? getImageUrl(restaurant.bannerUrl || restaurant.logoUrl)
    : '/zaykafood-logo.png';

  const isOpen = restaurant.isOpen !== false;

  return (
    <div className="group relative flex flex-col rounded-3xl bg-white transition-all duration-200 hover:-translate-y-0.5 border border-gray-100/80 shadow-sm hover:shadow-md">
      <Link href={`/restaurant/${restaurant.slug || restaurant.id}`} className="flex flex-col flex-1">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-3xl bg-gray-100">
          <img
            src={imageSrc}
            alt={restaurant.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/zaykafood-logo.png';
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />

          {/* Open/Closed Badge */}
          {!isOpen && (
            <div className="absolute top-2.5 left-2.5 rounded-xl bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-tight text-white shadow-sm">
              Closed
            </div>
          )}

          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isToggling}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition disabled:opacity-50"
            aria-label="Save to favorites"
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>

          {/* Rating Pill Bottom Left */}
          {rating ? (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
              <span>{rating}</span>
              <Star className="h-3 w-3 fill-white text-white" />
            </div>
          ) : (
            <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              New
            </div>
          )}
        </div>

        {/* Info Block */}
        <div className="p-3 space-y-1">
          <h3 className="text-sm sm:text-base font-black text-gray-900 truncate group-hover:text-rose-600 transition">
            {restaurant.name}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-500 flex-wrap">
            {deliveryTime && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3 text-gray-400" />
                {deliveryTime}
              </span>
            )}
            {deliveryTime && (distanceText || priceText) && <span>•</span>}
            {distanceText && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3 text-gray-400" />
                {distanceText}
              </span>
            )}
            {distanceText && priceText && <span>•</span>}
            {priceText && <span className="font-bold text-gray-700">{priceText}</span>}
          </div>

          {cuisineText && (
            <p className="text-[11px] text-gray-400 truncate font-medium">
              {cuisineText}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};
