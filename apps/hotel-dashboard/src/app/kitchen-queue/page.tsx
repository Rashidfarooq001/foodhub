'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Bike,
} from 'lucide-react';

import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { useKitchenStore } from '../../stores/use-kitchen-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

export default function KitchenQueuePage() {
  const { queue, setQueue } = useKitchenStore();
  const { accessToken } = useHotelAuthStore();

  const pending = queue.filter(
    (q) => q.status === 'PENDING',
  );

  const preparing = queue.filter(
    (q) => q.status === 'PREPARING',
  );

  const ready = queue.filter(
    (q) => q.status === 'READY_FOR_PICKUP',
  );

  const refreshOrders = async () => {
    const res = await fetch(
      `${API_BASE}/orders`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!res.ok) return;

    const data = await res.json();

    setQueue(
      Array.isArray(data)
        ? data
        : data.orders ?? [],
    );
  };

  React.useEffect(() => {
    refreshOrders();

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinRestaurant', { restaurantId: 'active-restaurant' });
    });

    const handleUpdate = () => {
      refreshOrders();
    };

    socket.on('order.created', handleUpdate);
    socket.on('order.status-changed', handleUpdate);
    socket.on('status.updated', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const updateOrderStatus = async (
    orderId: string,
    status: string,
  ) => {
    const res = await fetch(
      `${API_BASE}/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      },
    );

    if (!res.ok) {
      alert('Failed to update order');
      return;
    }

    await refreshOrders();
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between border-b border-gray-100 pb-4">

        <div>

          <h1 className="text-3xl font-black text-gray-900">
            Kitchen Display System (KDS)
          </h1>

          <p className="text-xs text-gray-500">
            Live kitchen order queue
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">

          <Clock className="h-4 w-4 animate-spin" />

          Live

        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{/* Pending Orders */}
<div className="rounded-3xl border border-amber-200 bg-amber-50/30 p-5 space-y-4">

  <div className="flex items-center justify-between border-b border-amber-200 pb-3">

    <h3 className="flex items-center gap-2 text-base font-black text-amber-900">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      New Orders ({pending.length})
    </h3>

  </div>

  <div className="space-y-4">

    {pending.map((order) => (

      <div
        key={order.id}
        className="rounded-2xl border border-amber-100 bg-white p-5 shadow-md space-y-3"
      >

        <div className="flex items-center justify-between">

          <span className="text-sm font-black">
            {order.orderNumber}
          </span>

          <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            {order.prepTimeMins} min
          </span>

        </div>

        <p className="text-xs font-bold">
          {order.customerName}
        </p>

        <div className="space-y-1 border-y border-gray-100 py-3">

          {order.items.map((item, idx) => (

            <div
              key={idx}
              className="flex justify-between text-xs"
            >
              <span>
                {item.quantity} × {item.name}
              </span>

              {item.notes && (
                <span className="italic text-amber-600">
                  {item.notes}
                </span>
              )}

            </div>

          ))}

        </div>

        <div className="flex gap-2">

          <button
            onClick={() =>
              updateOrderStatus(
                order.id,
                'PREPARING',
              )
            }
            className="flex-1 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-700"
          >
            Accept
          </button>

          <button
            onClick={() =>
              updateOrderStatus(
                order.id,
                'CANCELLED',
              )
            }
            className="rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            Reject
          </button>

        </div>

      </div>

    ))}

  </div>

</div>

{/* Preparing Orders */}

<div className="rounded-3xl border border-orange-200 bg-orange-50/30 p-5 space-y-4">

  <div className="flex items-center justify-between border-b border-orange-200 pb-3">

    <h3 className="flex items-center gap-2 text-base font-black text-orange-900">

      <Utensils className="h-5 w-5 text-orange-600" />

      Cooking ({preparing.length})

    </h3>

  </div>

  <div className="space-y-4">

    {preparing.map((order) => (

      <div
        key={order.id}
        className="rounded-2xl border border-orange-100 bg-white p-5 shadow-md space-y-3"
      >

        <div className="flex items-center justify-between">

          <span className="text-sm font-black">
            {order.orderNumber}
          </span>

          <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
            Preparing
          </span>

        </div>

        <div className="space-y-1 border-y border-gray-100 py-3">

          {order.items.map((item, idx) => (

            <div
              key={idx}
              className="text-xs font-bold"
            >
              {item.quantity} × {item.name}
            </div>

          ))}

        </div>

        <button
          onClick={() =>
            updateOrderStatus(
              order.id,
              'READY_FOR_PICKUP',
            )
          }
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Mark Ready
        </button>

      </div>

    ))}

  </div>

</div>{/* Ready for Pickup */}

<div className="rounded-3xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-4">

  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">

    <h3 className="flex items-center gap-2 text-base font-black text-emerald-900">

      <CheckCircle2 className="h-5 w-5 text-emerald-600" />

      Ready for Driver ({ready.length})

    </h3>

  </div>

  <div className="space-y-4">

    {ready.map((order) => (

      <div
        key={order.id}
        className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-md space-y-3"
      >

        <div className="flex items-center justify-between">

          <span className="text-sm font-black">
            {order.orderNumber}
          </span>

          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
            Awaiting Driver
          </span>

        </div>

        <div className="space-y-1 border-y border-gray-100 py-3">

          {order.items.map((item, idx) => (

            <div
              key={idx}
              className="flex justify-between text-xs font-medium text-gray-900"
            >

              <span>
                {item.quantity} × {item.name}
              </span>

            </div>

          ))}

        </div>

        <button
          onClick={() =>
            updateOrderStatus(
              order.id,
              'OUT_FOR_DELIVERY',
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white shadow-md hover:bg-blue-700"
        >

          <Bike className="h-4 w-4" />

          Order Picked Up

        </button>

      </div>

    ))}

  </div>

</div>

      </div>
    </div>
  );
}