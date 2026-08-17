'use client';

import React from 'react';
import { Bell, Sparkles, ShoppingBag, Tag } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 'n1',
      title: 'Order FH-9482 Out For Delivery',
      message: 'Courier Vikram Singh is on the way with your meal.',
      time: '10 mins ago',
      type: 'ORDER',
    },
    {
      id: 'n2',
      title: '50% OFF Weekend Discount Active',
      message: 'Use code ZAYKA50 on your next order above ₹199.',
      time: '2 hours ago',
      type: 'PROMO',
    },
    {
      id: 'n3',
      title: 'Discount Credit Received',
      message: 'Your account has received a ₹100 promotional coupon discount.',
      time: '1 day ago',
      type: 'SYSTEM',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Notifications</h1>
          <p className="text-xs text-gray-500">Live order updates & special promotional alerts</p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              {n.type === 'ORDER' ? <ShoppingBag className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
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
