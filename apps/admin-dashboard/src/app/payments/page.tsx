'use client';

import React from 'react';
import { CreditCard, DollarSign } from 'lucide-react';

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Payments & Merchant Settlements</h1>
        <p className="text-xs text-gray-500">Platform GMV revenue ledger, 18% commission fees & weekly merchant payouts</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400">TOTAL PLATFORM GMV</p>
          <h3 className="text-3xl font-black text-purple-600">₹4,85,000</h3>
          <p className="text-[10px] text-purple-600 font-bold">Processed today via Razorpay</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400">NET COMMISSION REVENUE (18%)</p>
          <h3 className="text-3xl font-black text-emerald-600">₹87,300</h3>
          <p className="text-[10px] text-emerald-600 font-bold">Platform net earnings</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400">MERCHANT SETTLEMENTS DUE</p>
          <h3 className="text-3xl font-black text-gray-900">₹3,97,700</h3>
          <p className="text-[10px] text-gray-400 font-bold">Scheduled for Friday payout</p>
        </div>
      </div>
    </div>
  );
}
