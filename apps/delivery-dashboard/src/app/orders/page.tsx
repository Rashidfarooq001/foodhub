'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function DeliveryOrdersPage() {
  const history = [
    { id: 't1', orderNumber: 'FH-819201', restaurant: 'Pizza Paradise', customer: 'Rahul S.', earnings: 70, status: 'DELIVERED', time: '24 July 2026' },
    { id: 't2', orderNumber: 'FH-718293', restaurant: 'Burger Bistro', customer: 'Priya P.', earnings: 65, status: 'DELIVERED', time: '18 July 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Trip History</h1>
        <p className="text-xs text-gray-500">Completed delivery logs and earned payouts</p>
      </div>

      {/* Mobile View: Cards (< 768px) */}
      <div className="block md:hidden space-y-4">
        {history.map((h) => (
          <div key={h.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-gray-900">{h.orderNumber}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {h.status}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-700">
              <p><span className="font-bold text-gray-900">Pickup:</span> {h.restaurant}</p>
              <p><span className="font-bold text-gray-900">Drop:</span> {h.customer}</p>
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-xs">
              <span className="font-black text-emerald-600">Earnings: ₹{h.earnings}</span>
              <span className="text-[10px] text-gray-400">{h.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table (>= 768px) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Pickup Restaurant</th>
                <th className="px-6 py-4">Drop Customer</th>
                <th className="px-6 py-4">Payout</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-black text-gray-900">{h.orderNumber}</td>
                  <td className="px-6 py-4">{h.restaurant}</td>
                  <td className="px-6 py-4">{h.customer}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">₹{h.earnings}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="h-3 w-3" /> {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
