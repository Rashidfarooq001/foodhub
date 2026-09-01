'use client';

import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { FoodItemData } from '../../data/mock-data';
import { useCartStore } from '../../stores/use-cart-store';
import { getImageUrl } from '@foodhub/config';

interface Props {
  food: FoodItemData;
  onCustomize?: (food: FoodItemData) => void;
}

export const FoodCard: React.FC<Props> = ({ food, onCustomize }) => {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const hasVariants = Boolean(food.variants && food.variants.length > 0);
  const hasAddons = Boolean(food.addonGroups && food.addonGroups.length > 0);
  const isCustomizable = hasVariants || hasAddons;

  // Calculate total quantity of this food item in cart
  const cartItemsForThisFood = items.filter((i) => i.foodItemId === food.id);
  const totalInCart = cartItemsForThisFood.reduce((sum, item) => sum + item.quantity, 0);

  // Determine display price (lowest if variants exist)
  let displayPrice = food.price;
  if (hasVariants && food.variants && food.variants.length > 0) {
    const prices = food.variants.map((v) => v.price).filter((p) => p > 0);
    if (prices.length > 0) {
      displayPrice = Math.min(...prices);
    }
  }

  const isAvailable = food.isAvailable !== false;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    // If customizable, open the bottom sheet modal
    if (isCustomizable && onCustomize) {
      onCustomize(food);
      return;
    }

    // Direct add for simple items
    addItem({
      foodItemId: food.id,
      name: food.name,
      price: food.price,
      imageUrl: food.imageUrl,
      isVeg: food.isVeg,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName,
      addons: [],
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (isCustomizable && onCustomize) {
      onCustomize(food);
      return;
    }

    // For single simple item, increment first matching cart item
    if (cartItemsForThisFood.length > 0) {
      const target = cartItemsForThisFood[0];
      updateQuantity(target.id, target.quantity + 1);
    } else {
      handleAddClick(e);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItemsForThisFood.length === 0) return;

    // Decrement the last added item
    const target = cartItemsForThisFood[cartItemsForThisFood.length - 1];
    if (target.quantity > 1) {
      updateQuantity(target.id, target.quantity - 1);
    } else {
      removeItem(target.id);
    }
  };

  return (
    <div
      onClick={() => isCustomizable && onCustomize && onCustomize(food)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 ${
        isCustomizable ? 'cursor-pointer' : ''
      } ${!isAvailable ? 'opacity-60 grayscale' : ''}`}
    >
      {/* 1. Food Image (~55-60% of card visual height) */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={getImageUrl(food.imageUrl)}
          alt={food.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* Veg / Non-Veg Indicator Badge */}
        <div className="absolute top-2 left-2 flex h-4 w-4 items-center justify-center rounded-sm bg-white/90 p-0.5 shadow-sm">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              food.isVeg
                ? 'bg-emerald-600 ring-1 ring-emerald-600'
                : 'bg-red-600 ring-1 ring-red-600'
            }`}
          />
        </div>

        {/* Rating Badge (if present) */}
        {food.rating ? (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-gray-800 shadow-sm">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span>{food.rating.toFixed(1)}</span>
          </div>
        ) : null}

        {/* Out of Stock Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] font-extrabold text-white">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* 2. Compact Item Info */}
      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 leading-snug">
            {food.name}
          </h3>
          {food.description && (
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">
              {food.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="mt-2 flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-gray-900">₹{displayPrice}</span>
            {isCustomizable && (
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">
                Customise
              </span>
            )}
          </div>

          {/* Compact Action Button */}
          {isAvailable && (
            <div>
              {totalInCart > 0 ? (
                <div className="flex items-center gap-1.5 rounded-lg bg-rose-600 text-white px-2 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="flex h-4 w-4 items-center justify-center hover:opacity-80 transition"
                  >
                    <Minus className="h-3 w-3 stroke-[3]" />
                  </button>
                  <span className="text-xs font-black min-w-[12px] text-center">{totalInCart}</span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="flex h-4 w-4 items-center justify-center hover:opacity-80 transition"
                  >
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-sm"
                  title="Add to cart"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
