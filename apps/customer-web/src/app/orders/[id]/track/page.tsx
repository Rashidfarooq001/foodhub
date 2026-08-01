'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { ActiveOrderTrackingData } from '../../../../data/mock-data';
import { OrderTimeline } from '../../../../components/tracking/OrderTimeline';
import { Phone, ShieldCheck, Clock, MapPin, Store, Bike, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useAuthStore } from '../../../../stores/use-auth-store';

const API_BASE = getApiBaseUrl();

const DynamicLiveTrackingMap = dynamic(
  () => import('../../../../components/tracking/LiveTrackingMap').then((m) => m.LiveTrackingMap),
  { ssr: false },
);

export default function LiveOrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { accessToken } = useAuthStore();

  const [rawOrder, setRawOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setRawOrder(data);
        }
      } catch {
        /* offline */
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId, accessToken]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  const orderData: ActiveOrderTrackingData = rawOrder
    ? {
        orderId: rawOrder.id || orderId,
        orderNumber: rawOrder.orderNumber || `FH-${orderId.slice(0, 6)}`,
        restaurantName: rawOrder.restaurantName || rawOrder.restaurant?.name || 'FoodHub Bistro',
        restaurantAddress: rawOrder.restaurantAddress || rawOrder.restaurant?.addressLine || 'Indiranagar, Bengaluru',
        restaurantLat: rawOrder.restaurantLat || rawOrder.restaurant?.latitude || 12.9716,
        restaurantLng: rawOrder.restaurantLng || rawOrder.restaurant?.longitude || 77.5946,
        customerAddress: rawOrder.customerAddress || rawOrder.deliveryAddress?.street || '100 Ft Road, Indiranagar',
        customerLat: rawOrder.customerLat || 12.9780,
        customerLng: rawOrder.customerLng || 77.6400,
        driverLat: rawOrder.driverLat || 12.9740,
        driverLng: rawOrder.driverLng || 77.6100,
        driverName: rawOrder.driverName || 'Ramesh Kumar (Courier)',
        driverPhone: rawOrder.driverPhone || '+919876543210',
        driverPhoto: rawOrder.driverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        vehicleNumber: rawOrder.vehicleNumber || 'KA-01-EE-9482',
        deliveryOtp: rawOrder.deliveryOtp || '1234',
        etaMins: rawOrder.etaMins || 25,
        status: rawOrder.status || 'PREPARING',
        placedAt: rawOrder.placedAt || (rawOrder.createdAt ? new Date(rawOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
        items: Array.isArray(rawOrder.items)
          ? rawOrder.items
          : Array.isArray(rawOrder.orderItems)
            ? rawOrder.orderItems.map((i: any) => ({ name: i.foodItem?.name || i.name || 'Item', quantity: i.quantity, price: Number(i.unitPrice || i.price || 0) }))
            : [],
        totalAmount: Number(rawOrder.totalAmount || 0),
      }
    : {
        orderId: orderId,
        orderNumber: `FH-${orderId.slice(0, 6)}`,
        restaurantName: 'FoodHub Bistro',
        restaurantAddress: 'Indiranagar, Bengaluru',
        restaurantLat: 12.9716,
        restaurantLng: 77.5946,
        customerAddress: '100 Ft Road, Bengaluru',
        customerLat: 12.9780,
        customerLng: 77.6400,
        driverLat: 12.9740,
        driverLng: 77.6100,
        driverName: 'Ramesh Kumar (Courier)',
        driverPhone: '+919876543210',
        driverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        vehicleNumber: 'KA-01-EE-9482',
        deliveryOtp: '1234',
        etaMins: 25,
        status: 'PREPARING',
        placedAt: 'Just now',
        items: [],
        totalAmount: 0,
      };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
              Order {orderData.orderNumber}
            </span>
            <span className="text-xs font-bold text-gray-500">Placed at {orderData.placedAt}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-1">Live Delivery Map</h1>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">
          <Clock className="h-5 w-5 animate-spin text-orange-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-orange-600">Estimated Arrival</p>
            <p className="text-base font-black">{orderData.etaMins} Minutes</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Order Steps */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Interactive Map & Delivery Courier Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-xl bg-gray-900">
            <DynamicLiveTrackingMap
              restaurantLat={orderData.restaurantLat}
              restaurantLng={orderData.restaurantLng}
              customerLat={orderData.customerLat}
              customerLng={orderData.customerLng}
              driverLat={orderData.driverLat}
              driverLng={orderData.driverLng}
              driverName={orderData.driverName}
            />
          </div>

          {/* Assigned Driver Card */}
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <img
                src={orderData.driverPhoto}
                alt={orderData.driverName}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-orange-500"
              />
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    (orderData as any).deliveryMode === 'RESTAURANT_SELF_DELIVERY'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {(orderData as any).deliveryMode === 'RESTAURANT_SELF_DELIVERY'
                    ? 'Restaurant Self Delivery'
                    : 'Express Delivery Partner'}
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">{orderData.driverName}</h3>
                <p className="text-xs text-gray-500">Verified Courier • Hero Splendor (KA-01-EE-9482)</p>
              </div>
            </div>

            <a
              href={`tel:${orderData.driverPhone}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
            >
              <Phone className="h-4 w-4" /> Call Delivery Partner
            </a>
          </div>
        </div>

        {/* Right 1 Col: Timeline & Order Details */}
        <div className="space-y-6">
          {/* Timeline Component */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <OrderTimeline currentStatus={orderData.status} />
          </div>

          {/* Order Items & Restaurant Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-orange-50 rounded-2xl text-orange-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900">{orderData.restaurantName}</h4>
                <p className="text-[10px] text-gray-400">{orderData.restaurantAddress}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">Order Items</p>
              {(orderData.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between text-gray-700 font-medium">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-4 text-[10px] text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Contactless Safe Delivery Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
