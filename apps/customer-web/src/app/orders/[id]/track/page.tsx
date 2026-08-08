'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { OrderTimeline } from '../../../../components/tracking/OrderTimeline';
import { Phone, ShieldCheck, Clock, MapPin, Store, Bike, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useAuthStore } from '../../../../stores/use-auth-store';
import { io, Socket } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

const DynamicLiveTrackingMap = dynamic(
  () => import('../../../../components/tracking/LiveTrackingMap').then((m) => m.LiveTrackingMap),
  { ssr: false },
);

export default function LiveOrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { accessToken } = useAuthStore();

  const [order, setOrder] = useState<any | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchOrderAndTracking = async () => {
    try {
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const [orderRes, trackingRes] = await Promise.all([
        fetch(`${API_BASE}/orders/${orderId}`, { headers }),
        fetch(`${API_BASE}/orders/${orderId}/tracking`, { headers }),
      ]);

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrder(orderData);
      }

      if (trackingRes.ok) {
        const trackData = await trackingRes.json();
        if (trackData?.driverLat && trackData?.driverLng) {
          setDriverLoc({ lat: trackData.driverLat, lng: trackData.driverLng });
        }
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndTracking();

    // Set up Socket.IO real-time connection
    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket: Socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('joinOrder', { orderId });
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Real-time location broadcast
    socket.on('driver.location', (data: { lat: number; lng: number }) => {
      if (data?.lat && data?.lng) {
        setDriverLoc({ lat: data.lat, lng: data.lng });
      }
    });

    // Real-time status update broadcasts
    const handleStatusUpdate = (data: any) => {
      fetchOrderAndTracking();
    };

    socket.on('status.updated', handleStatusUpdate);
    socket.on('order.accepted', handleStatusUpdate);
    socket.on('order.preparing', handleStatusUpdate);
    socket.on('order.ready', handleStatusUpdate);
    socket.on('driver.assigned', handleStatusUpdate);
    socket.on('order.picked_up', handleStatusUpdate);
    socket.on('order.delivered', handleStatusUpdate);
    socket.on('order.cancelled', handleStatusUpdate);

    // Fallback polling interval (5 seconds)
    const interval = setInterval(fetchOrderAndTracking, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [orderId, accessToken]);

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
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-rose-500" />
        <h2 className="text-2xl font-black text-gray-900">Order Not Found</h2>
        <p className="text-xs text-gray-500">We couldn't locate this order or you do not have permission to view it.</p>
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Orders
        </button>
      </div>
    );
  }


  const deliveryAddress = order.deliveryAddress || {};
  const restaurantLat = order.restaurant?.latitude || 12.9716;
  const restaurantLng = order.restaurant?.longitude || 77.5946;
  const customerLat = deliveryAddress.latitude || 12.9780;
  const customerLng = deliveryAddress.longitude || 77.6400;

  const currentDriverLat = driverLoc?.lat || restaurantLat + 0.003;
  const currentDriverLng = driverLoc?.lng || restaurantLng + 0.003;

  const distKm = Math.sqrt(
    Math.pow((customerLat - currentDriverLat) * 111, 2) +
    Math.pow((customerLng - currentDriverLng) * 111, 2),
  );
  const etaMins = Math.max(5, Math.ceil((distKm / 25) * 60) + 5);

  const driverName = order.assignedRestaurantDriver
    ? `${order.assignedRestaurantDriver.firstName} ${order.assignedRestaurantDriver.lastName || ''}`.trim()
    : 'Assigned Partner';
  const driverPhone = order.assignedRestaurantDriver?.phone || '+919876543210';
  const vehicleNumber = order.assignedRestaurantDriver?.vehicleNumber || 'KA-01-EE-9482';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> View Order Details
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
              Order #{order.orderNumber}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
              <span className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isSocketConnected ? 'Live Socket Connected' : 'Auto Syncing (5s)'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mt-1">Live Delivery Tracking Map</h1>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">
          <Clock className="h-5 w-5 animate-spin text-orange-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-orange-600">Estimated Arrival</p>
            <p className="text-base font-black">{etaMins} Minutes</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Progress Timeline */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-xl bg-gray-900 h-[450px]">
            <DynamicLiveTrackingMap
              restaurantLat={restaurantLat}
              restaurantLng={restaurantLng}
              customerLat={customerLat}
              customerLng={customerLng}
              driverLat={currentDriverLat}
              driverLng={currentDriverLng}
              driverName={driverName}
            />
          </div>

          {/* Assigned Driver Card */}
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Bike className="h-7 w-7" />
              </div>
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  Active Courier
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">{driverName}</h3>
                <p className="text-xs text-gray-500">Verified Express Partner • {vehicleNumber}</p>
              </div>
            </div>

            <a
              href={`tel:${driverPhone}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
            >
              <Phone className="h-4 w-4" /> Call Delivery Partner
            </a>
          </div>
        </div>

        {/* Right Column: Timeline & Store Info */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <OrderTimeline currentStatus={order.status} />
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-orange-50 rounded-2xl text-orange-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900">{order.restaurant?.name}</h4>
                <p className="text-[10px] text-gray-400">{order.restaurant?.addressLine}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">Order Items</p>
              {(order.orderItems || []).map((item: any) => (
                <div key={item.id} className="flex justify-between text-gray-700 font-medium">
                  <span>{item.quantity}x {item.foodItem?.name || item.name}</span>
                  <span className="font-bold text-gray-900">₹{Number(item.totalPrice).toFixed(2)}</span>
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
