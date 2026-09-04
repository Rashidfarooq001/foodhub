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

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'biryani',
    name: 'Biryani',
    image:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'pizza',
    name: 'Pizza',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'burger',
    name: 'Burger',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'wazwan',
    name: 'Wazwan',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'kashmiri',
    name: 'Kashmiri',
    image:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'chinese',
    name: 'Chinese',
    image:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    image:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'desserts',
    name: 'Desserts',
    image:
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=120&q=70',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    image:
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=120&q=70',
  },
];

export const CategoryCarousel: React.FC<Props & { initialCategories?: any[] }> = ({ selectedCategory, onSelectCategory, initialCategories = [] }) => {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.categories ?? []);
          if (list.length > 0 && isMounted) {
            setCategories(list);
            return;
          }
        }
      } catch (err) {
        // silent fallback to default categories
      }
    };
    if (categories.length === 0) fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
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
  const allItems: CategoryItem[] = [{ id: 'all', name: 'All', image: '' }, ...categories];

  return (
    <div className="w-full">
      <div className="flex md:grid md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 items-start gap-3.5 sm:gap-4 md:gap-y-6 overflow-x-auto md:overflow-x-visible pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
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
              {/*
                Use a fixed outer wrapper div that NEVER changes size.
                The border is always 1px, the padding is always 2px.
                The rose ring is drawn as a box-shadow (outset) so it
                occupies ZERO layout space — it draws outside the element
                without pushing anything.
              */}
              <div
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-gray-200 bg-gray-50 transition-shadow duration-200 overflow-hidden shrink-0"
                style={isSelected ? { boxShadow: '0 0 0 2px #e11d48' } : undefined}
              >
                {cat.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600">
                    <span className="font-black text-sm sm:text-base tracking-tight">ALL</span>
                  </div>
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs text-center transition-colors max-w-[70px] truncate font-bold ${
                  isSelected ? 'text-rose-600' : 'text-gray-700 group-hover:text-gray-900'
                }`}
              >
                {cat.name}
              </span>
              {/* Always in DOM, transparent when not selected — reserves exact 2px vertical space */}
              <div
                className={`h-0.5 w-6 rounded-full transition-colors -mt-1 ${
                  isSelected ? 'bg-rose-600' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

