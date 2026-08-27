'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, SlidersHorizontal, Clock, Star, MapPin, Tag, RotateCcw } from 'lucide-react';

export interface FilterState {
  under30Mins: boolean;
  rating4Plus: boolean;
  pureVeg: boolean;
  nearMe: boolean;
  hasOffers: boolean;
  sortBy: 'relevance' | 'rating' | 'deliveryTime' | 'distance';
}

export const initialFilterState: FilterState = {
  under30Mins: false,
  rating4Plus: false,
  pureVeg: false,
  nearMe: false,
  hasOffers: false,
  sortBy: 'relevance',
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  matchingCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  matchingCount,
}) => {
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const hasAnyFilter =
    draftFilters.under30Mins ||
    draftFilters.rating4Plus ||
    draftFilters.pureVeg ||
    draftFilters.nearMe ||
    draftFilters.hasOffers ||
    draftFilters.sortBy !== 'relevance';

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  const handleReset = () => {
    setDraftFilters(initialFilterState);
    onResetFilters();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-4 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Filters &amp; Sort</h3>
              <p className="text-[11px] text-gray-500">Refine restaurants to your taste</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section 1: Sort By */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">
            Sort By
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'relevance', label: 'Relevance (Default)' },
              { id: 'rating', label: 'Rating: High to Low' },
              { id: 'deliveryTime', label: 'Delivery Time: Fastest' },
              { id: 'distance', label: 'Distance: Nearest First' },
            ].map((option) => {
              const active = draftFilters.sortBy === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDraftFilters({ ...draftFilters, sortBy: option.id as any })}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-bold transition ${
                    active
                      ? 'border-rose-600 bg-rose-50/60 text-rose-700 font-black shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Quick Filter Toggles */}
        <div className="space-y-2.5">
          <label className="text-xs font-black uppercase tracking-wider text-gray-800">
            Filter Kitchens
          </label>

          <div className="space-y-2">
            {/* Under 30 mins */}
            <div
              onClick={() =>
                setDraftFilters({ ...draftFilters, under30Mins: !draftFilters.under30Mins })
              }
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                draftFilters.under30Mins
                  ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Under 30 mins</p>
                  <p className="text-[10px] text-gray-500">Fast delivery from nearby kitchens</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={draftFilters.under30Mins}
                onChange={() => {}}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </div>

            {/* Rating 4.0+ */}
            <div
              onClick={() =>
                setDraftFilters({ ...draftFilters, rating4Plus: !draftFilters.rating4Plus })
              }
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                draftFilters.rating4Plus
                  ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Rating 4.0+</p>
                  <p className="text-[10px] text-gray-500">Top customer-rated kitchens only</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={draftFilters.rating4Plus}
                onChange={() => {}}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </div>

            {/* Pure Veg */}
            <div
              onClick={() =>
                setDraftFilters({ ...draftFilters, pureVeg: !draftFilters.pureVeg })
              }
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                draftFilters.pureVeg
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs">
                  🌱
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Pure Veg Only</p>
                  <p className="text-[10px] text-gray-500">Only 100% vegetarian restaurants</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={draftFilters.pureVeg}
                onChange={() => {}}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {/* Near Me */}
            <div
              onClick={() =>
                setDraftFilters({ ...draftFilters, nearMe: !draftFilters.nearMe })
              }
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                draftFilters.nearMe
                  ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Near Me (&le; 10 km)</p>
                  <p className="text-[10px] text-gray-500">Kitchens in your immediate delivery radius</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={draftFilters.nearMe}
                onChange={() => {}}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </div>

            {/* Active Offers */}
            <div
              onClick={() =>
                setDraftFilters({ ...draftFilters, hasOffers: !draftFilters.hasOffers })
              }
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                draftFilters.hasOffers
                  ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Active Offers &amp; Discounts</p>
                  <p className="text-[10px] text-gray-500">Restaurants running meal discounts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={draftFilters.hasOffers}
                onChange={() => {}}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasAnyFilter}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 transition active:scale-[0.99]"
          >
            <span>Apply Filters</span>
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px]">
              {matchingCount} Kitchens
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
