import React from 'react';
import { FilterState } from './FilterModal';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  activeCount: number;
}

export const DesktopSidebar: React.FC<Props> = ({
  filters,
  setFilters,
  onClearAll,
  hasActiveFilters,
  activeCount,
}) => {
  const toggleFilter = (key: keyof FilterState) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (typeof next[key] === 'boolean') {
        (next as any)[key] = !next[key];
      }
      return next;
    });
  };

  const setSortBy = (sort: 'relevance' | 'rating' | 'deliveryTime' | 'distance') => {
    setFilters((prev) => ({ ...prev, sortBy: sort }));
  };

  return (
    <div className="sticky top-[100px] flex flex-col gap-8 pb-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.under30Mins}
              onChange={() => toggleFilter('under30Mins')}
              className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
            />
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Under 30 mins</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.rating4Plus}
              onChange={() => toggleFilter('rating4Plus')}
              className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
            />
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Ratings 4.0+</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.pureVeg}
              onChange={() => toggleFilter('pureVeg')}
              className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
            />
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Pure Veg</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.nearMe}
              onChange={() => toggleFilter('nearMe')}
              className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
            />
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Near Me</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.hasOffers}
              onChange={() => toggleFilter('hasOffers')}
              className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
            />
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Offers</span>
          </label>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight mb-4">Sort By</h2>
        <div className="space-y-3">
          {(['relevance', 'rating', 'deliveryTime', 'distance'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="sortByDesktop"
                checked={filters.sortBy === opt}
                onChange={() => setSortBy(opt)}
                className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 capitalize">
                {opt === 'deliveryTime' ? 'Delivery Time' : opt}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
