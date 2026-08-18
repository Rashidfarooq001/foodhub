'use client';

import React, { useState, useRef } from 'react';
import { Star, Plus, Minus, Check, ChevronDown, Sparkles } from 'lucide-react';
import { FoodItemData, FoodVariantData } from '../../data/mock-data';
import { useCartStore } from '../../stores/use-cart-store';
import { getImageUrl } from '@foodhub/config';

interface Props {
  food: FoodItemData;
  onCustomize?: (food: FoodItemData) => void;
}

export const FoodCard: React.FC<Props> = ({ food, onCustomize }) => {
  const { items, addItem } = useCartStore();

  const hasVariants = Boolean(food.variants && food.variants.length > 0);
  const availableVariants = (food.variants || []).filter((v) => v.isAvailable !== false);

  // Local component state
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    // If exactly 1 variant exists, default to it
    if (food.variants && food.variants.length === 1 && food.variants[0].isAvailable !== false) {
      return food.variants[0].id;
    }
    return '';
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const variantSelectRef = useRef<HTMLSelectElement>(null);

  // Selected variant object
  const selectedVariant: FoodVariantData | undefined = food.variants?.find(
    (v) => v.id === selectedVariantId,
  );

  // Determine current active unit price
  const activeUnitPrice = selectedVariant
    ? selectedVariant.price
    : food.price;

  const isItemAvailable = food.isAvailable !== false;
  const isSelectedVariantAvailable = selectedVariant ? selectedVariant.isAvailable !== false : true;
  const isPurchaseable = isItemAvailable && isSelectedVariantAvailable;

  // Check how many of the currently selected variant are already in cart
  const currentVariantKey = selectedVariantId || 'default';
  const cartItem = items.find(
    (i) => i.foodItemId === food.id && (i.variantId || 'default') === currentVariantKey,
  );
  const inCartQuantity = cartItem?.quantity || 0;

  const handleQuantityDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityIncrement = () => {
    setQuantity((prev) => Math.min(20, prev + 1));
  };

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    setSelectedVariantId(vId);
    setValidationError(null);
  };

  const handleAddToCart = () => {
    if (!isItemAvailable) return;

    // 1. Variant validation
    if (hasVariants && !selectedVariantId) {
      setValidationError('Please select a variant');
      if (variantSelectRef.current) {
        variantSelectRef.current.focus();
      }
      return;
    }

    if (selectedVariant && selectedVariant.isAvailable === false) {
      setValidationError('Selected variant is out of stock');
      return;
    }

    // 2. Add to cart store with authoritative price & quantity
    addItem(
      {
        foodItemId: food.id,
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.variantName,
        name: food.name,
        price: activeUnitPrice,
        imageUrl: food.imageUrl,
        isVeg: food.isVeg,
        restaurantId: food.restaurantId,
        restaurantName: food.restaurantName,
        addons: [],
      },
      quantity,
    );

    // 3. Trigger visual feedback
    setIsAdded(true);
    setValidationError(null);
    setTimeout(() => {
      setIsAdded(false);
    }, 1400);
  };

  return (
    <div className="group flex flex-col rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-orange-200/80 w-full max-w-full min-w-0 overflow-hidden">
      {/* ================================================== */}
      {/* 1. FOOD IMAGE (Top)                                */}
      {/* ================================================== */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] bg-gray-100 overflow-hidden">
        <img
          src={getImageUrl(food.imageUrl)}
          alt={food.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3Cpath d='M10 8h.01'/%3E%3C/svg%3E";
          }}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !isItemAvailable ? 'grayscale opacity-60' : ''
          }`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges (Veg/Non-Veg & Bestseller) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {/* Veg / Non-Veg Indicator */}
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md bg-white/95 shadow-sm border ${
              food.isVeg ? 'border-emerald-600 text-emerald-600' : 'border-rose-600 text-rose-600'
            }`}
            title={food.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                food.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>

          {/* Bestseller Badge */}
          {food.isBestseller && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="h-3 w-3" />
              Bestseller
            </span>
          )}
        </div>

        {/* In-Cart Indicator Pill */}
        {inCartQuantity > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md">
              {inCartQuantity} in cart
            </span>
          </div>
        )}

        {/* Unavailable Overlay */}
        {!isItemAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="rounded-xl bg-gray-900/90 text-white px-3 py-1 text-xs font-black uppercase tracking-wider border border-white/20 shadow-lg">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 2. FOOD INFORMATION (Two-Column Section)          */}
      {/* ================================================== */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 items-start">
          {/* ---------------- LEFT COLUMN ---------------- */}
          <div className="space-y-1.5 min-w-0">
            {/* Food Name */}
            <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 break-words group-hover:text-orange-600 transition-colors">
              {food.name}
            </h3>

            {/* Rating / Stars */}
            <div className="flex items-center gap-1 text-xs">
              {food.rating && food.rating > 0 ? (
                <>
                  <div className="flex items-center gap-0.5 text-amber-500 font-black">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{food.rating}</span>
                  </div>
                  {food.ratingCount && food.ratingCount > 0 ? (
                    <span className="text-gray-400 text-[10px]">({food.ratingCount})</span>
                  ) : null}
                </>
              ) : (
                <span className="text-[10px] text-gray-400 font-medium">New item</span>
              )}
            </div>

            {/* Price (Dynamic according to selected variant) */}
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-base sm:text-lg font-black text-gray-900">
                ₹{activeUnitPrice}
              </span>
              {food.originalPrice && food.originalPrice > activeUnitPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{food.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* ---------------- RIGHT COLUMN ---------------- */}
          <div className="flex flex-col items-end space-y-2 min-w-0">
            {/* Quantity Stepper Control */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Qty
              </span>
              <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50/80 p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleQuantityDecrement}
                  disabled={!isPurchaseable || quantity <= 1}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-white hover:text-orange-600 transition disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px] min-w-[32px]"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-black text-gray-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleQuantityIncrement}
                  disabled={!isPurchaseable || quantity >= 20}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-white hover:text-orange-600 transition disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px] min-w-[32px]"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Variant Selector (if variants exist) */}
            {hasVariants && (
              <div className="w-full flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Variant
                </span>
                <div className="relative w-full">
                  <select
                    ref={variantSelectRef}
                    value={selectedVariantId}
                    onChange={handleVariantChange}
                    disabled={!isItemAvailable}
                    className={`w-full appearance-none rounded-xl border py-1.5 pl-2.5 pr-6 text-[11px] font-bold text-gray-900 bg-white focus:outline-none transition min-h-[36px] ${
                      validationError && !selectedVariantId
                        ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500'
                        : 'border-gray-200 focus:border-orange-500'
                    }`}
                  >
                    <option value="" disabled>
                      Select Variant
                    </option>
                    {food.variants?.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={v.isAvailable === false}
                      >
                        {v.variantName} • ₹{v.price}
                        {v.isAvailable === false ? ' (Out of stock)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Warning Prompt */}
        {validationError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-center text-[11px] font-bold text-rose-700 animate-shake">
            {validationError}
          </div>
        )}

        {/* Optional Addons Trigger (if addon groups exist) */}
        {food.addonGroups && food.addonGroups.length > 0 && onCustomize && (
          <div className="pt-1 flex items-center justify-between border-t border-gray-50 text-[11px]">
            <span className="text-gray-400 font-medium">Custom add-ons available</span>
            <button
              type="button"
              onClick={() => onCustomize(food)}
              className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
            >
              Customize +
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* 3. PROMINENT FULL-WIDTH ADD TO CART BUTTON         */}
        {/* ================================================== */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isPurchaseable}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all min-h-[44px] shadow-sm ${
              !isPurchaseable
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-[0.99]'
                : 'bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white shadow-orange-500/25'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Added to Cart</span>
              </>
            ) : !isPurchaseable ? (
              <span>Unavailable</span>
            ) : inCartQuantity > 0 ? (
              <>
                <Plus className="h-4 w-4" />
                <span>Add More (₹{activeUnitPrice * quantity})</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add To Cart • ₹{activeUnitPrice * quantity}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

