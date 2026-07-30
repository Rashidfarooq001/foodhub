'use client';

import React from 'react';
import { Bike, CheckCircle2 } from 'lucide-react';

export default function DeliveryOrdersPage() {
  const history = [
    { id: 't1', orderNumber: 'FH-819201', restaurant: 'Pizza Paradise', customer: 'Rahul S.', earnings: 70, status: 'DELIVERED', time: '24 July 2026' },
    { id: 't2', orderNumber: 'FH-718293', restaurant: 'Burger Bistro', customer: 'Priya P.', earnings: 65, status: 'DELIVERED', time: '18 July 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Trip History</h1>
        <p className="text-xs text-gray-500">Completed delivery logs and earned payouts</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
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
  );
}
