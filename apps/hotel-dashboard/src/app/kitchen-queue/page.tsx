'use client';

import React from 'react';
import { useKitchenStore } from '../../stores/use-kitchen-store';
import { Clock, CheckCircle2, AlertCircle, Utensils, Bike } from 'lucide-react';

export default function KitchenQueuePage() {
  const { queue, acceptOrder, markReady, cancelOrder } = useKitchenStore();

  const pending = queue.filter((q) => q.status === 'PENDING');
  const preparing = queue.filter((q) => q.status === 'PREPARING');
  const ready = queue.filter((q) => q.status === 'READY_FOR_PICKUP');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Kitchen Display System (KDS)</h1>
          <p className="text-xs text-gray-500">Live order queue display for kitchen station staff</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200">
          <Clock className="h-4 w-4 animate-spin" /> Live Queue Auto-Refresh Active
        </div>
      </div>

      {/* KDS 3-Column Display */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Column 1: Pending Orders */}
        <div className="rounded-3xl border border-amber-200 bg-amber-50/30 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h3 className="text-base font-black text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" /> New Orders ({pending.length})
            </h3>
          </div>

          <div className="space-y-4">
            {pending.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-5 shadow-md border border-amber-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-gray-900">{order.orderNumber}</span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                    Prep ~{order.prepTimeMins}m
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-800">{order.customerName}</p>

                <div className="space-y-1 border-y border-gray-100 py-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-medium text-gray-900">
                      <span>{item.quantity}x {item.name}</span>
                      {item.notes && <span className="text-[10px] text-amber-600 italic">{item.notes}</span>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => acceptOrder(order.id)}
                    className="flex-1 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700 shadow-md"
                  >
                    Accept & Prepare
                  </button>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Preparing Orders */}
        <div className="rounded-3xl border border-orange-200 bg-orange-50/30 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-orange-200 pb-3">
            <h3 className="text-base font-black text-orange-900 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-orange-600" /> Cooking ({preparing.length})
            </h3>
          </div>

          <div className="space-y-4">
            {preparing.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-5 shadow-md border border-orange-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-gray-900">{order.orderNumber}</span>
                  <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
                    In Kitchen
                  </span>
                </div>

                <div className="space-y-1 border-y border-gray-100 py-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold text-gray-900">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>

                {order.driverName && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5 text-orange-600" /> Driver: {order.driverName} ({order.driverPhone})
                  </p>
                )}

                <button
                  onClick={() => markReady(order.id)}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
                >
                  Mark Ready for Pickup
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready for Pickup */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <h3 className="text-base font-black text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Ready for Driver ({ready.length})
            </h3>
          </div>

          <div className="space-y-4">
            {ready.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-5 shadow-md border border-emerald-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-gray-900">{order.orderNumber}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    Awaiting Courier
                  </span>
                </div>

                <div className="space-y-1 border-y border-gray-100 py-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-medium text-gray-900">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>

                {order.driverName ? (
                  <div className="rounded-xl bg-gray-50 p-2.5 text-xs font-bold text-gray-800">
                    Assigned Rider: {order.driverName} ({order.driverPhone})
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      alert(`Self-Delivery Rider Ramesh Kumar assigned to ${order.orderNumber}`);
                    }}
                    className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-black text-white hover:bg-orange-700 shadow-md flex items-center justify-center gap-2"
                  >
                    <Bike className="h-4 w-4" /> Assign Self Delivery Rider
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
