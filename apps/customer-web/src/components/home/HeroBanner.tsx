'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';

const BANNERS = [
  {
    id: 1,
    title: '50% OFF On Your First Order',
    subtitle: 'Taste top rated meals from handpicked local kitchens near you.',
    code: 'FOODHUB50',
    bgGradient: 'from-orange-600 via-amber-600 to-rose-600',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: 'Free Unlimited Weekend Delivery',
    subtitle: 'Zero delivery fee on all orders above ₹199 from verified restaurants.',
    code: 'FREEDEL',
    bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: 'Biryani Fiesta Weekend',
    subtitle: 'Authentic Hyderabadi & Lucknowi Dum Biryanis up to 40% OFF.',
    code: 'BIRYANI40',
    bgGradient: 'from-purple-600 via-indigo-600 to-blue-600',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  },
];

export const HeroBanner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[current];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
          className={`grid min-h-[360px] grid-cols-1 items-center gap-8 bg-gradient-to-r ${banner.bgGradient} p-8 sm:p-12 lg:grid-cols-2`}
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold backdrop-blur-md">
              <Sparkles className="h-4 w-4" /> SPECIAL OFFER
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {banner.title}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
              {banner.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/restaurants"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-gray-900 shadow-xl transition hover:bg-gray-100"
              >
                Order Now <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-black/20 px-4 py-3 text-xs font-bold backdrop-blur-md">
                <Tag className="h-4 w-4" /> Use Code: <span className="tracking-widest text-amber-300">{banner.code}</span>
              </div>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <img
              src={banner.image}
              alt={banner.title}
              className="h-72 w-96 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-8 flex gap-2">
        {BANNERS.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all ${
              idx === current ? 'w-8 bg-white' : 'w-2.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
