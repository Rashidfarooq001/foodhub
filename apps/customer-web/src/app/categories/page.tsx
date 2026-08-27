'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryData } from '../../data/mock-data';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : data.categories ?? []);
        }
      } catch { /* backend offline */ } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-4 lg:px-5 space-y-4">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Food Categories</h1>
        <p className="text-xs text-gray-500">Explore meals by specialty and cuisine type</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            ))
          : categories.map((cat: CategoryData) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-32 w-full overflow-hidden rounded-2xl">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="text-lg font-black">{cat.name}</h3>
                    <p className="text-[10px] text-white/80">{cat.itemCount} Dishes Available</p>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
