'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '@foodhub/config';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  initialCategories?: any[];
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

export const CategoryCarousel: React.FC<Props> = ({ selectedCategory, onSelectCategory, initialCategories = [] }) => {
  const [categories, setCategories] = useState<CategoryItem[]>(
    initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  );
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
          }
        }
      } catch (err) {
        // fallback
      }
    };
    
    if (categories === DEFAULT_CATEGORIES) {
      fetchCategories();
    }
    
    return () => {
      isMounted = false;
    };
  }, [categories]);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const clientWidth = scrollContainerRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -(clientWidth / 2) : (clientWidth / 2);
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350); // check after smooth scroll
    }
  };

  const allItems: CategoryItem[] = [{ id: 'all', name: 'All', image: '' }, ...categories];

  return (
    <div className="w-full relative group">
      
      {canScrollLeft && (
        <button 
          onClick={() => scrollByAmount('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md text-gray-700 hover:text-rose-600 hover:border-rose-200 transition-colors focus:outline-none"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {canScrollRight && (
        <button 
          onClick={() => scrollByAmount('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md text-gray-700 hover:text-rose-600 hover:border-rose-200 transition-colors focus:outline-none"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex flex-row items-start gap-3.5 sm:gap-4 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-1 snap-x snap-mandatory scroll-smooth"
      >
        {allItems.map((cat) => {
          const isSelected =
            (selectedCategory === '' && cat.id === 'all') ||
            selectedCategory.toLowerCase() === cat.name.toLowerCase();

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id === 'all' ? '' : cat.name)}
              className="group flex flex-col items-center gap-1.5 shrink-0 focus:outline-none snap-start"
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  minWidth: '72px',
                  minHeight: '72px',
                  maxWidth: '72px',
                  maxHeight: '72px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 0 0 2px #e11d48' : undefined,
                  transition: 'box-shadow 0.2s',
                }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600">
                    <span className="font-black text-sm tracking-tight">ALL</span>
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
