'use client';

import React from 'react';
import Link from 'next/link';

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  slug: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'all',
    name: 'All',
    slug: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'biryani',
    name: 'Biryani',
    slug: 'biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'pizza',
    name: 'Pizza',
    slug: 'pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'burger',
    name: 'Burger',
    slug: 'burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'kashmiri',
    name: 'Kashmiri',
    slug: 'kashmiri',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'chinese',
    name: 'Chinese',
    slug: 'chinese',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'wazwan',
    name: 'Wazwan',
    slug: 'wazwan',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    slug: 'bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'desserts',
    name: 'Desserts',
    slug: 'desserts',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    slug: 'beverages',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200&q=80',
  },
];

interface Props {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryCarousel: React.FC<Props> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => {
          const isSelected = (selectedCategory === '' && cat.id === 'all') || selectedCategory.toLowerCase() === cat.slug;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.slug)}
              className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
            >
              <div
                className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-full p-0.5 transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-rose-600 ring-offset-2 scale-105 shadow-md shadow-rose-500/20'
                    : 'hover:scale-105 shadow-sm border border-gray-100'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full rounded-full object-cover"
                  loading="lazy"
                />
              </div>
              <span
                className={`text-[11px] sm:text-xs text-center transition-colors ${
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
