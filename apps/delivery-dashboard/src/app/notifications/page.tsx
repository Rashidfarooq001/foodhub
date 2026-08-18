'use client';

import React from 'react';
import { Bell, DollarSign, Bike } from 'lucide-react';

export default function DeliveryNotificationsPage() {
  const notifications = [
    {
      id: 'n1',
      title: 'Weekly Incentive Credited!',
      message: '₹500 weekly peak incentive added to your settlement payout statement.',
      time: '2 hours ago',
      type: 'PAYOUT',
    },
    {
      id: 'n2',
      title: 'New Order Request Assigned',
      message: 'Order #ZF-948210 ready for pickup at Spice Garden.',
      time: 'Yesterday',
      type: 'ORDER',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Courier Notifications &amp; Alerts
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Live job broadcast notifications, order assignments &amp; weekly earnings deposits
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
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
