'use client';

import React from 'react';
import { Bell, ShoppingBag, DollarSign } from 'lucide-react';

export default function HotelNotificationsPage() {
  const notifications = [
    { id: 'n1', title: 'New Order Received #FH-948211', message: '1x Hyderabadi Biryani ready to prepare.', time: '5 mins ago' },
    { id: 'n2', title: 'Weekly Settlement Transferred', message: '₹24,850 credited to HDFC Bank Account.', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Merchant Notifications</h1>
        <p className="text-xs text-gray-500">Live order notifications & financial payout alerts</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                <span className="text-[10px] text-gray-400">{n.time}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
