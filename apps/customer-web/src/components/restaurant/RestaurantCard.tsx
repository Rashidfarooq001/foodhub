'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, MapPin, Tag } from 'lucide-react';
import { RestaurantData } from '../../data/mock-data';

interface Props {
  restaurant: RestaurantData;
}

export const RestaurantCard: React.FC<Props> = ({ restaurant }) => {
  return (
    <Link
      href={`/restaurant/${restaurant.slug}`}
      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Banner & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={restaurant.bannerUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Discount Badge */}
        {restaurant.discountBadge && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white shadow-lg">
            <Tag className="h-3.5 w-3.5" /> {restaurant.discountBadge}
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{restaurant.avgRating}</span>
          <span className="text-gray-400">({restaurant.ratingCount})</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition">
            {restaurant.name}
          </h3>
        </div>

        <p className="text-xs text-gray-500 truncate">
          {restaurant.cuisines.join(' • ')}
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-orange-600" />
            <span>{restaurant.deliveryTimeMins} mins</span>
          </div>
          <div className="flex items-center gap-1 font-medium">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span>{restaurant.distanceKm} km away</span>
          </div>
          <div className="font-bold text-gray-900">
            ₹{restaurant.priceForTwo} for two
          </div>
        </div>
      </div>
    </Link>
  );
};
