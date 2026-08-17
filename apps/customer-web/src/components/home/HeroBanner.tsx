'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';

const BANNERS = [
  {
    id: 1,
    title: '50% OFF On Your First Order',
    subtitle: 'Taste top rated meals from handpicked local kitchens near you.',
    code: 'ZAYKA50',
    bg: 'bg-orange-600',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    title: 'Free Weekend Delivery',
    subtitle: 'Zero delivery fee on all orders above ₹199 from verified restaurants.',
    code: 'FREEDEL',
    bg: 'bg-emerald-600',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    title: 'Biryani Fiesta Weekend',
    subtitle: 'Authentic Hyderabadi & Lucknowi Biryanis up to 40% OFF.',
    code: 'BIRYANI40',
    bg: 'bg-purple-700',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  },
];

export const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[current];

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-2xl">
      {/* Slides */}
      {BANNERS.map((b, idx) => (
        <div
          key={b.id}
          className={`${b.bg} transition-opacity duration-500 ${
            idx === current ? 'block' : 'hidden'
          }`}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-8">
            {/* Text */}
            <div className="flex-1 space-y-3 text-white min-w-0">
              <h2 className="text-xl font-black leading-tight sm:text-2xl lg:text-3xl break-words">
                {b.title}
              </h2>
              <p className="text-sm text-white/85 leading-relaxed">{b.subtitle}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/restaurants"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-100 transition"
                >
                  Order Now <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-black/20 px-3 py-2 text-xs font-bold text-white">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span>Code: <span className="text-yellow-300 tracking-wider">{b.code}</span></span>
                </div>
              </div>
            </div>

            {/* Image — hidden on mobile to keep banner compact */}
            <div className="hidden sm:block shrink-0">
              <img
                src={b.image}
                alt={b.title}
                className="h-40 w-48 rounded-xl object-cover shadow-lg lg:h-48 lg:w-56"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-3 left-5 flex gap-1.5">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === current ? 'w-6 bg-white' : 'w-2 bg-white/40'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
