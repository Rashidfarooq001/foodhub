'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryData } from '../../data/mock-data';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export const CategorySlider: React.FC = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : data.categories ?? []);
        }
      } catch { /* backend offline */ }
    };
    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">What&apos;s on your mind?</h2>
          <p className="text-xs text-gray-500">Explore dishes by popularity and cuisine</p>
        </div>
        <Link href="/categories" className="text-xs font-bold text-orange-600 hover:underline">
          View All Categories →
        </Link>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.id}`}
            className="group flex flex-col items-center gap-2 min-w-[100px]"
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-100 bg-gray-50 p-1 transition group-hover:scale-105 group-hover:border-orange-500 group-hover:shadow-md">
              <img
                src={cat.image}
                alt={cat.name}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <span className="text-xs font-bold text-gray-800 transition group-hover:text-orange-600">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
