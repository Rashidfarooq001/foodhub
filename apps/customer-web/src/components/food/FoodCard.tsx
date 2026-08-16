'use client';

import React from 'react';
import { Star, Plus, Minus } from 'lucide-react';
import { FoodItemData } from '../../data/mock-data';
import { useCartStore } from '../../stores/use-cart-store';
import { getImageUrl } from '@foodhub/config';


interface Props {
  food: FoodItemData;
  onCustomize?: (food: FoodItemData) => void;
}

export const FoodCard: React.FC<Props> = ({ food, onCustomize }) => {
  const { items, addItem, updateQuantity } = useCartStore();

  const cartItem = items.find((i) => i.foodItemId === food.id);
  const quantity = cartItem?.quantity || 0;

  const isItemAvailable = food.isAvailable !== false;

  const handleAdd = () => {
    if (!isItemAvailable) return;

    if ((food.variants && food.variants.length > 0) || (food.addonGroups && food.addonGroups.length > 0)) {
      if (onCustomize) onCustomize(food);
    } else {
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
    }
  };

  return (
    <div className="flex flex-col-reverse gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-start sm:justify-between">
      {/* Food Details */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {/* Veg/Non-Veg Badge */}
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
              food.isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                food.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>

          {food.isBestseller && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
              ★ BESTSELLER
            </span>
          )}
        </div>

        <h4 className="text-base font-bold text-gray-900">{food.name}</h4>

        <div className="flex items-center gap-2">
          <span className="text-base font-black text-gray-900">₹{food.price}</span>
          {food.originalPrice && (
            <span className="text-xs text-gray-400 line-through">₹{food.originalPrice}</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold">{food.rating}</span>
          <span className="text-gray-400">({food.ratingCount})</span>
        </div>

        <p className="line-clamp-2 text-xs text-gray-500">{food.description}</p>
      </div>

      {/* Food Image & Action Button */}
      <div className="relative flex flex-col items-center self-center sm:self-start flex-shrink-0">
        <img
          src={getImageUrl(food.imageUrl)}
          alt={food.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3Cpath d='M10 8h.01'/%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3C/svg%3E";
          }}
          className="h-28 w-28 sm:h-28 sm:w-28 rounded-2xl object-cover bg-gray-50 border border-gray-100"
        />


        {/* Stepper or Add Button */}
        <div className="absolute -bottom-2">
          {!isItemAvailable ? (
            <span className="rounded-xl bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-500 border border-gray-200">
              Unavailable
            </span>
          ) : quantity > 0 && (!food.variants || food.variants.length === 0) ? (
            <div className="flex items-center rounded-xl bg-orange-600 text-white shadow-lg">
              <button
                onClick={() => updateQuantity(cartItem!.id, quantity - 1)}
                className="px-2.5 py-1 hover:bg-orange-700 rounded-l-xl"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 text-xs font-black">{quantity}</span>
              <button
                onClick={() => updateQuantity(cartItem!.id, quantity + 1)}
                className="px-2.5 py-1 hover:bg-orange-700 rounded-r-xl"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 rounded-xl bg-white px-5 py-1.5 text-xs font-black text-orange-600 shadow-md ring-1 ring-orange-500 hover:bg-orange-50"
            >
              <span>{food.variants && food.variants.length > 0 ? 'CUSTOMIZE' : 'ADD'}</span>
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
