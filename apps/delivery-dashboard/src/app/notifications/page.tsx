'use client';

import React from 'react';
import { Bell, DollarSign, Bike } from 'lucide-react';

export default function DeliveryNotificationsPage() {
  const notifications = [
    { id: 'n1', title: 'Weekly Bonus Credited!', message: '₹500 weekly peak incentive added to your wallet.', time: '2 hours ago' },
    { id: 'n2', title: 'New Order Request Assigned', message: 'Order #FH-948210 ready for pickup at Spice Garden.', time: 'Yesterday' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Courier Notifications</h1>
        <p className="text-xs text-gray-500">Live order assignments & weekly bonus payout notifications</p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                <span className="text-[10px] text-gray-400">{n.time}</span>
              </div>
              <p className="text-xs text-gray-600">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
