'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, MapPin, Tag } from 'lucide-react';
import { RestaurantData } from '../../data/mock-data';
import { getImageUrl } from '@foodhub/config';

interface Props {
  restaurant: RestaurantData;
}

export const RestaurantCard: React.FC<Props> = ({ restaurant }) => {
  return (
    <Link
      href={`/restaurant/${restaurant.slug}`}
      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full max-w-full min-w-0 flex flex-col"
    >
      {/* Banner & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 shrink-0">
        <img
          src={getImageUrl(restaurant.bannerUrl || restaurant.logoUrl)}
          alt={restaurant.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Discount Badge */}
        {restaurant.discountBadge && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white shadow-lg">
            <Tag className="h-3.5 w-3.5 shrink-0" /> {restaurant.discountBadge}
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md backdrop-blur-md">
          {restaurant.avgRating && restaurant.avgRating > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>{restaurant.avgRating}</span>
              <span className="text-gray-400 text-[10px]">({restaurant.ratingCount || 0})</span>
            </>
          ) : (
            <span className="text-[11px] text-gray-500 font-semibold">No reviews yet</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition break-words">
            {restaurant.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {restaurant.cuisines.join(' • ')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[11px] sm:text-xs text-gray-600">
          <div className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-orange-600 shrink-0" />
            <span>
              {restaurant.deliveryTimeMins && restaurant.deliveryTimeMins > 0
                ? `${restaurant.deliveryTimeMins} mins`
                : 'Time unavailable'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>
              {restaurant.distanceKm !== undefined && restaurant.distanceKm !== null && restaurant.distanceKm > 0
                ? `${restaurant.distanceKm} km away`
                : 'Distance unavailable'}
            </span>
          </div>
          <div className="font-bold text-gray-900">
            {restaurant.priceForTwo && restaurant.priceForTwo > 0
              ? `₹${restaurant.priceForTwo} for two`
              : 'Price not available'}
          </div>
        </div>
      </div>
    </Link>
  );
};
