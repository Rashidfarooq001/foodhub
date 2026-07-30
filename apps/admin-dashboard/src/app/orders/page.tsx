'use client';

import React, { useState } from 'react';
import { Search, ShoppingBag, RotateCcw } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders] = useState([
    { id: 'o1', orderNumber: 'FH-948210', customer: 'Rahul Sharma', restaurant: 'Spice Garden', amount: 685, status: 'DELIVERED', date: 'Today' },
    { id: 'o2', orderNumber: 'FH-948211', customer: 'Priya Patel', restaurant: 'Spice Garden', amount: 340, status: 'PREPARING', date: 'Today' },
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Global Orders Log</h1>
        <p className="text-xs text-gray-500">Platform-wide order search, timeline inspection & refund triggers</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Order #</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Restaurant</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-black text-gray-900">{o.orderNumber}</td>
                <td className="px-6 py-4">{o.customer}</td>
                <td className="px-6 py-4">{o.restaurant}</td>
                <td className="px-6 py-4 font-black text-gray-900">₹{o.amount}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-black text-purple-800">
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => alert(`Initiated full refund of ₹${o.amount} for Order ${o.orderNumber}!`)}
                    className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Initiate Refund
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
