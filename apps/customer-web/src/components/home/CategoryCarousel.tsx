'use client';

import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@foodhub/config';
import { Utensils } from 'lucide-react';

const API_BASE = getApiBaseUrl();

export interface CategoryItem {
  id: string;
  name: string;
  image?: string;
  itemCount?: number;
}

interface Props {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryCarousel: React.FC<Props> = ({ selectedCategory, onSelectCategory }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.categories ?? [];
          setCategories(list);
        }
      } catch (err) {
        console.error('Failed to load categories from API', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-100" />
            <div className="h-2.5 w-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  // Items to display: Always include 'All', plus all dynamic categories from backend
  const allItems: CategoryItem[] = [
    { id: 'all', name: 'All', image: '' },
    ...categories,
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {allItems.map((cat) => {
          const isSelected =
            (selectedCategory === '' && cat.id === 'all') ||
            selectedCategory.toLowerCase() === cat.name.toLowerCase();

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.name)}
              className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
            >
              <div
                className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full p-0.5 transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-rose-600 ring-offset-2 scale-105 shadow-md shadow-rose-500/20'
                    : 'hover:scale-105 shadow-sm border border-gray-100 bg-gray-50'
                }`}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full rounded-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <Utensils className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs text-center transition-colors max-w-[70px] truncate ${
                  isSelected ? 'font-black text-rose-600' : 'font-bold text-gray-700 group-hover:text-gray-900'
                }`}
              >
                {cat.name}
              </span>
              {isSelected && <div className="h-0.5 w-6 rounded-full bg-rose-600 -mt-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
