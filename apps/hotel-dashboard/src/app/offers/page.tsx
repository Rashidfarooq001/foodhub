'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, Ticket } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

interface OfferItem {
  id: string;
  code: string;
  discount: string;
  minOrder: number;
  maxDiscount: number;
  active: boolean;
}

export default function HotelOffersPage() {
  const { accessToken } = useHotelAuthStore();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/coupons`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setOffers(
              data.map((c: any) => ({
                id: c.id,
                code: c.code,
                discount: c.discountPercent ? `${c.discountPercent}% OFF` : `₹${c.discountAmount} OFF`,
                minOrder: Number(c.minOrderAmount || 0),
                maxDiscount: Number(c.maxDiscountAmount || 0),
                active: c.isActive ?? true,
              })),
            );
          }
        }
      } catch (err) {
        console.error('Failed to load offers', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Promotions & Offers</h1>
          <p className="text-xs text-gray-500">Configure merchant discount rules and minimum order values</p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm font-bold text-gray-400">Loading active promotions...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Ticket className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No active promotions</p>
          <p className="text-xs text-gray-400">Promotions and platform discount campaigns configured for your store will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {offers.map((off) => (
            <div key={off.id} className="rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-orange-900 text-lg">
                  <Tag className="h-5 w-5 text-orange-600" /> {off.code}
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">
                  ACTIVE
                </span>
              </div>
              <p className="text-base font-bold text-gray-900">{off.discount} on orders above ₹{off.minOrder}</p>
              <p className="text-xs text-gray-500">Max Discount: ₹{off.maxDiscount}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
