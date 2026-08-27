'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountVal: number;
  minOrderVal: number;
  description?: string;
}

export const HeroBanner: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/coupons`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.coupons ?? [];
          setCoupons(list);
        }
      } catch {
        // coupons offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (coupons.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % coupons.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [coupons]);

  if (isLoading) {
    return <div className="h-32 sm:h-40 w-full rounded-2xl bg-gray-100 animate-pulse" />;
  }

  // If no active coupons exist in backend, render clean platform welcome card
  if (coupons.length === 0) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 text-rose-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Zayka Food Delivery
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Delicious Food Delivered Fast Across Kashmir
            </h2>
            <p className="text-xs sm:text-sm text-rose-100">
              Order fresh meals, biryani, wazwan and more from verified local kitchens.
            </p>
          </div>
          <Link
            href="/restaurants"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shrink-0 shadow-sm"
          >
            Explore Restaurants <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const activeCoupon = coupons[current] || coupons[0];
  const discountLabel =
    activeCoupon.discountType === 'PERCENTAGE'
      ? `${activeCoupon.discountVal}% OFF`
      : `FLAT ₹${activeCoupon.discountVal} OFF`;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 p-5 sm:p-7 text-white shadow-sm transition-all duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 text-rose-200 text-xs font-bold uppercase tracking-wider">
            <Tag className="h-3.5 w-3.5" /> Special Offer Available
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {discountLabel} on Orders above ₹{activeCoupon.minOrderVal || 0}
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl">
            {activeCoupon.description || 'Apply this promo code at checkout to enjoy instant savings on your order.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition shadow-sm"
            >
              Order Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/30 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
              <span>Code: <span className="font-mono text-yellow-300 font-black tracking-wider">{activeCoupon.code}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      {coupons.length > 1 && (
        <div className="absolute bottom-3 right-5 flex gap-1.5">
          {coupons.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === current ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
