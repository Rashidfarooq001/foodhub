'use client';

import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2 } from 'lucide-react';

export default function HotelOffersPage() {
  const [offers] = useState([
    { id: 'o1', code: 'SPICE50', discount: '50% OFF', minOrder: 199, maxDiscount: 100, active: true },
    { id: 'o2', code: 'FLAT100', discount: 'Flat ₹100 OFF', minOrder: 299, maxDiscount: 100, active: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Promotions & Offers</h1>
          <p className="text-xs text-gray-500">Configure merchant discount rules and minimum order values</p>
        </div>
        <button
          onClick={() => alert('Create Offer Modal')}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-lg hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Create Merchant Coupon
        </button>
      </div>

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
    </div>
  );
}
