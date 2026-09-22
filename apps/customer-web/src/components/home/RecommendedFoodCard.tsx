'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Plus } from 'lucide-react';
import { getImageUrl } from '@foodhub/config';
import { useCartStore } from '../../stores/use-cart-store';
import { FoodItemData } from '../../data/mock-data';

interface Props {
  food: any;
  onCustomize?: (food: any) => void;
}

export const RecommendedFoodCard: React.FC<Props> = ({ food, onCustomize }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const [imgSrc, setImgSrc] = useState(getImageUrl(food.imageUrl));

  const hasVariants = Boolean(food.variants && food.variants.length > 0);
  const hasAddons = Boolean(food.addonGroups && food.addonGroups.length > 0);
  const needsCustomization = hasVariants || hasAddons;

  const cartItem = !needsCustomization
    ? items.find((i) => i.foodItemId === food.id && !i.variantId)
    : undefined;
  const quantity = cartItem?.quantity || 0;

  const restaurantName = food.restaurant?.name || '';
  const restaurantId = food.restaurant?.id || '';
  const isRestaurantOpen = food.restaurant?.isOnline !== false && food.restaurant?.isOpen !== false;
  const isAvailable = food.isAvailable !== false && isRestaurantOpen;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) return;

    if (needsCustomization && onCustomize) {
      onCustomize(food);
      return;
    }

    if (quantity === 0) {
      addItem({
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        foodItemId: food.id,
        name: food.name,
        price: Number(food.price),
        isVeg: food.isVeg !== false,
        addons: []
      });
    } else {
      updateQuantity(food.id, quantity + 1);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm w-full h-full overflow-hidden shrink-0">
      <Link href={`/restaurant/${restaurantId}`} className="flex flex-col h-full">
        <div className="relative aspect-video w-full bg-gray-50 overflow-hidden">
          <Image
            src={imgSrc || '/zaykafood-logo.png'}
            alt={food.name}
            fill
            sizes="(max-width: 640px) 150px, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgSrc('/zaykafood-logo.png')}
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-md">Unavailable</span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-rose-600 transition">
              {food.name}
            </h3>
            <p className="text-[11px] font-bold text-gray-500 mt-0.5 line-clamp-1">{restaurantName}</p>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-black text-gray-900">₹{Number(food.price)}</span>
            
            {isAvailable ? (
              quantity > 0 ? (
                <div className="flex items-center bg-rose-50 border border-rose-200 rounded-lg overflow-hidden h-7">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(food.id, quantity - 1); }}
                    className="w-7 h-full flex items-center justify-center text-rose-600 font-bold hover:bg-rose-100"
                  >-</button>
                  <span className="w-5 text-center text-xs font-black text-rose-700">{quantity}</span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(food.id, quantity + 1); }}
                    className="w-7 h-full flex items-center justify-center text-rose-600 font-bold hover:bg-rose-100"
                  >+</button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="flex items-center justify-center h-7 px-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-black hover:bg-rose-600 hover:text-white transition-colors"
                >
                  ADD {needsCustomization && <Plus className="w-3 h-3 ml-0.5" />}
                </button>
              )
            ) : (
              <span className="text-[10px] text-gray-400 font-bold">SOLD OUT</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
