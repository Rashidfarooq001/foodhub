'use client';

import React, { useState, useEffect } from 'react';
import { CouponData } from '../../data/mock-data';
import { Tag, Copy, Check } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/coupons`);
        if (res.ok) {
          const data = await res.json();
          setCoupons(Array.isArray(data) ? data : data.coupons ?? []);
        }
      } catch {
        // Backend offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Available Coupons &amp; Offers</h1>
        <p className="text-xs text-gray-500">Copy promo codes to claim instant discounts during checkout</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Tag className="mx-auto h-10 w-10 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No coupons available right now</p>
          <p className="text-xs text-gray-400">Check back later for exclusive offers and deals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-6 shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white">
                    <Tag className="h-4 w-4" />
                  </span>
                  <span className="text-lg font-black text-orange-900">{c.code}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{c.description}</p>
                <p className="text-[10px] text-gray-500">Valid till {c.validTill}</p>
              </div>

              <button
                onClick={() => handleCopy(c.code)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-orange-600 shadow-md ring-1 ring-orange-200 hover:bg-orange-600 hover:text-white transition"
              >
                {copiedCode === c.code ? (
                  <>
                    <Check className="h-4 w-4" /> Code Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Code
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
