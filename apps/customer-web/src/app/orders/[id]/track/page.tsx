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
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [serverEtaMins, setServerEtaMins] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchOrderAndTracking = async () => {
    if (!accessToken) return;
    try {
      const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` };
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
        if (trackData?.distanceKm) setDistanceKm(trackData.distanceKm);
          if (trackData?.etaMins) setServerEtaMins(trackData.etaMins);
          if (trackData?.driverLat && trackData?.driverLng) {
          setDriverLoc({ lat: trackData.driverLat, lng: trackData.driverLng });
            if (trackData.updatedAt) setLastUpdate(new Date(trackData.updatedAt));
            else setLastUpdate(new Date());
        }
        if (Array.isArray(trackData?.routeCoordinates) && trackData.routeCoordinates.length > 0) {
          setRouteCoords(trackData.routeCoordinates);
        }
        if (typeof trackData?.etaMins === 'number') {
          setServerEtaMins(trackData.etaMins);
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
      fetchOrderAndTracking();
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Real-time location broadcast
    socket.on('driver.location', (data: { lat: number; lng: number }) => {
      if (data?.lat && data?.lng) {
        setDriverLoc({ lat: data.lat, lng: data.lng });
          setLastUpdate(new Date());
      }
    });

    // Real-time status update broadcasts
    const handleStatusUpdate = (data: any) => {
      fetchOrderAndTracking();
    };

    socket.on('order.status_updated', handleStatusUpdate);

    // Fallback polling interval (5 seconds)
    const interval = setInterval(fetchOrderAndTracking, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [orderId, accessToken]);

    const [timeAgoStr, setTimeAgoStr] = useState('LIVE');
  useEffect(() => {
    const interval = setInterval(() => {
      const diffSec = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
      if (diffSec < 10) setTimeAgoStr('LIVE');
      else if (diffSec < 60) setTimeAgoStr(`Updating location...`);
      else setTimeAgoStr(`Last updated ${Math.floor(diffSec/60)} min ago`);
    }, 5000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-rose-500" />
        <h2 className="text-2xl font-black text-gray-900">Order Not Found</h2>
        <p className="text-xs text-gray-500">We couldn't locate this order or you do not have permission to view it.</p>
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-600 px-4 py-3 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Orders
        </button>
      </div>
    );
  }


  const deliveryAddress = order.deliveryAddress || {};
  const restaurantLat = order.restaurant?.latitude ? Number(order.restaurant.latitude) : 0;
  const restaurantLng = order.restaurant?.longitude ? Number(order.restaurant.longitude) : 0;


  
  const handleRecenter = () => {
    window.dispatchEvent(new Event('recenter-rider'));
  };

  const customerLat = deliveryAddress.latitude ? Number(deliveryAddress.latitude) : 0;
  const customerLng = deliveryAddress.longitude ? Number(deliveryAddress.longitude) : 0;

  const currentDriverLat = driverLoc?.lat;
  const currentDriverLng = driverLoc?.lng;

  

  const isDriverAssigned = Boolean(order.assignedRestaurantDriver);
  const driverName = isDriverAssigned
    ? `${order.assignedRestaurantDriver.firstName} ${order.assignedRestaurantDriver.lastName || ''}`.trim()
    : 'Assigning Delivery Partner...';
  const driverPhone = order.assignedRestaurantDriver?.phone || '';
  const vehicleNumber = order.assignedRestaurantDriver?.vehicleNumber || '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 pb-10">
      {/* Explicit Location Status Banner (STATE A, B, C, D) */}
      <div
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          order.status === 'DELIVERED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isDriverAssigned && driverLoc
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isDriverAssigned
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-lg text-white ${
              order.status === 'DELIVERED'
                ? 'bg-emerald-600'
                : isDriverAssigned && driverLoc
                ? 'bg-emerald-600'
                : isDriverAssigned
                ? 'bg-blue-600'
                : 'bg-amber-600'
            }`}
          >
            {order.status === 'DELIVERED' ? '✓' : isDriverAssigned ? '🚴' : '⏳'}
          </div>
          <div>
            <p className="text-xs font-bold">Order #{order.orderNumber}</p>
            <p className="text-sm font-black">
              {order.status === 'DELIVERED'
                ? 'Order Delivered'
                : isDriverAssigned && driverLoc
                ? `Out for delivery with ${driverName}`
                : isDriverAssigned
                ? `Delivery partner assigned (${driverName})`
                : 'Waiting for delivery partner'}
            </p>
            <p className="text-xs mt-0.5 opacity-90">
              {order.status === 'DELIVERED'
                ? 'Thank you for ordering with ZaykaFood!'
                : isDriverAssigned && driverLoc
                ? 'Live location active on map below.'
                : isDriverAssigned
                ? 'Delivery partner assigned. Live location will appear shortly.'
                : 'Kitchen is preparing your order. Partner will be assigned soon.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/orders')}
          className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-bold border border-gray-300 hover:bg-gray-50 transition text-gray-800"
        >
          View All Orders
        </button>
      </div>

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
              <span className={`h-2 w-2 rounded-full ${!isSocketConnected ? 'bg-amber-500 animate-pulse' : timeAgoStr === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {!isSocketConnected ? 'Reconnecting...' : timeAgoStr === 'LIVE' ? 'Live Socket Connected' : 'Rider location updating...'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Live Delivery Tracking</h1>
        </div>

        {order.status === 'DELIVERED' ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 ring-1 ring-emerald-200">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">Status</p>
              <p className="text-sm font-black">Delivered o"</p>
            </div>
          </div>
        ) : isDriverAssigned ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 ring-1 ring-emerald-200">
            <Clock className="h-5 w-5 animate-spin text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">Estimated Arrival</p>
              <p className="text-base font-black">{serverEtaMins ? `${serverEtaMins} Minutes` : 'Calculating...'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">
            <Clock className="h-5 w-5 animate-spin text-orange-600" />
            <div>
              <p className="text-[10px] uppercase font-bold text-orange-600">Status</p>
              <p className="text-xs font-black">Waiting for delivery partner</p>
            </div>
          </div>
        )}
      </div>



      {/* Main Grid: Interactive Map & Progress Timeline */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl bg-gray-900 h-[45vh] md:h-[50vh] lg:h-[600px] relative">
            <DynamicLiveTrackingMap
              restaurantLat={restaurantLat}
              restaurantLng={restaurantLng}
              customerLat={customerLat}
              customerLng={customerLng}
              driverLat={currentDriverLat}
              driverLng={currentDriverLng}
              driverName={driverName}
              orderStatus={order.status}
              routeCoordinates={routeCoords}
            />
          </div>

          {/* Assigned Driver Card */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Bike className="h-7 w-7" />
              </div>
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' : isDriverAssigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.status === 'DELIVERED' ? 'Delivery Completed' : isDriverAssigned ? (distanceKm ? `${distanceKm.toFixed(1)} km away` : 'Active Courier') : 'Searching for Courier'}
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">{driverName}</h3>
                <p className="text-xs text-gray-500">
                  {isDriverAssigned
                    ? `Verified Express Partner • ${vehicleNumber}`
                    : 'Kitchen is preparing your food. Courier details will update automatically.'}
                </p>
              </div>
            </div>

            {isDriverAssigned && driverPhone && (
              <a
                href={`tel:${driverPhone}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700"
              >
                <Phone className="h-4 w-4" /> Call Delivery Partner
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Store Info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <OrderTimeline currentStatus={order.status} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
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
