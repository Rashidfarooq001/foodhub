'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { ActiveOrderTrackingData } from '../../../../data/mock-data';
import { OrderTimeline } from '../../../../components/tracking/OrderTimeline';
import { Phone, ShieldCheck, Clock, MapPin, Store, Bike, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const DynamicLiveTrackingMap = dynamic(
  () => import('../../../../components/tracking/LiveTrackingMap').then((m) => m.LiveTrackingMap),
  { ssr: false },
);

export default function LiveOrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ActiveOrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}`);
        if (res.ok) {
          setOrder(await res.json());
        }
      } catch { /* offline */ } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-gray-500">
          Order tracking details unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
              Order {order.orderNumber}
            </span>
            <span className="text-xs font-bold text-gray-500">Placed at {order.placedAt}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-1">Live Delivery Map</h1>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">
          <Clock className="h-5 w-5 animate-spin text-orange-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-orange-600">Estimated Arrival</p>
            <p className="text-base font-black">{order.etaMins} Minutes</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Order Steps */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Interactive Map & Delivery Courier Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-xl bg-gray-900">
            <DynamicLiveTrackingMap
              restaurantLat={order.restaurantLat}
              restaurantLng={order.restaurantLng}
              customerLat={order.customerLat}
              customerLng={order.customerLng}
              driverLat={order.driverLat}
              driverLng={order.driverLng}
              driverName={order.driverName}
            />
          </div>

          {/* Assigned Driver Card */}
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <img
                src={order.driverPhoto}
                alt={order.driverName}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-orange-500"
              />
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  FOODHUB VERIFIED RIDER
                </span>
                <h3 className="text-lg font-black text-gray-900">{order.driverName}</h3>
                <p className="text-xs text-gray-500">{order.vehicleNumber}</p>
              </div>
            </div>

            <a
              href={`tel:${order.driverPhone}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition"
            >
              <Phone className="h-4 w-4" /> Call Courier
            </a>
          </div>

          {/* OTP Delivery Verification Banner */}
          <div className="flex items-center justify-between rounded-3xl bg-amber-500 p-6 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-amber-200" />
              <div>
                <p className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                  SHARE OTP WITH DRIVER AT DOORSTEP
                </p>
                <p className="text-2xl font-black tracking-widest">{order.deliveryOtp}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-200 max-w-[120px] text-right">
              Do not share OTP until delivery package is handed over
            </span>
          </div>
        </div>

        {/* Right Col: Timeline & Items Summary */}
        <div className="space-y-6">
          {/* Order Progress Timeline */}
          <OrderTimeline currentStatus={order.status} />

          {/* Items Summary Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Items ({order.restaurantName})
            </h3>
            <div className="space-y-2 text-xs">
              {order.items.map((i: { name: string; quantity: number; price: number }, idx: number) => (
                <div key={idx} className="flex justify-between font-medium text-gray-700">
                  <span>
                    {i.quantity}x {i.name}
                  </span>
                  <span className="font-bold text-gray-900">₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-black text-gray-900">
              <span>Total Paid</span>
              <span className="text-orange-600">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
