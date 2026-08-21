'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { RestaurantData } from '../../data/mock-data';
import { getImageUrl } from '@foodhub/config';

interface Props {
  restaurant: RestaurantData;
  offerText?: string;
}

export const RecommendedCard: React.FC<Props> = ({ restaurant, offerText }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const fallbackOffers = ['FLAT 50% OFF', 'FLAT 30% OFF', 'FLAT 40% OFF', '20% OFF UPTO ₹100'];
  const displayOffer =
    offerText ||
    restaurant.discountBadge ||
    fallbackOffers[Math.abs(restaurant.name.length) % fallbackOffers.length];

  const rating = restaurant.avgRating && restaurant.avgRating > 0 ? restaurant.avgRating.toFixed(1) : '4.3';
  const deliveryTime = restaurant.deliveryTimeMins && restaurant.deliveryTimeMins > 0 ? `${restaurant.deliveryTimeMins} mins` : '25-30 mins';
  const cuisineText = (restaurant.cuisines && restaurant.cuisines.length > 0)
    ? restaurant.cuisines.slice(0, 2).join(', ')
    : 'Biryani, North Indian';

  return (
    <div className="group relative flex flex-col rounded-3xl bg-white transition-all duration-200 hover:-translate-y-0.5">
      <Link href={`/restaurant/${restaurant.slug}`} className="flex flex-col flex-1">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gray-100">
          <img
            src={getImageUrl(restaurant.bannerUrl || restaurant.logoUrl)}
            alt={restaurant.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Offer Badge Top Left */}
          {displayOffer && (
            <div className="absolute top-2.5 left-2.5 rounded-xl bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-white shadow-sm">
              {displayOffer}
            </div>
          )}

          {/* Favorite Heart Button Top Right */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
            aria-label="Save to favorites"
          >
            <Heart
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>

          {/* Rating Pill Bottom Left */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
            <span>{rating}</span>
            <Star className="h-3 w-3 fill-white text-white" />
          </div>
        </div>

        {/* Info Block */}
        <div className="pt-2.5 pb-1 px-1 space-y-0.5">
          <h3 className="text-sm sm:text-base font-black text-gray-900 truncate group-hover:text-rose-600 transition">
            {restaurant.name}
          </h3>

          <p className="text-[11px] sm:text-xs font-semibold text-gray-500">
            <span>{deliveryTime}</span> • <span className="font-bold text-gray-700">₹₹</span>
          </p>

          <p className="text-[11px] text-gray-400 truncate font-medium">
            {cuisineText}
          </p>
        </div>
      </Link>
    </div>
  );
};
