'use client';

import React from 'react';
import { Bell, ShoppingBag, DollarSign, CheckCircle2 } from 'lucide-react';

export default function HotelNotificationsPage() {
  const notifications = [
    {
      id: 'n1',
      title: 'New Order Received #ZF-948211',
      message: '1x Hyderabadi Biryani ready to prepare for customer dispatch.',
      time: '5 mins ago',
      type: 'ORDER',
    },
    {
      id: 'n2',
      title: 'Weekly Payout Settlement Transferred',
      message: '₹24,850 credited to registered Bank Account via IMPS / NEFT.',
      time: '1 day ago',
      type: 'PAYOUT',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Merchant Notifications &amp; Alerts
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Live kitchen order dispatch updates &amp; automated bank settlement deposit records
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-gray-900">{n.title}</h4>
                <span className="text-[10px] text-gray-400 font-medium shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
