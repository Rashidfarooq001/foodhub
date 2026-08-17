'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  Navigation,
  Phone,
  Clock,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { io } from 'socket.io-client';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? getApiBaseUrl()
    : 'https://foodhub-backend-enq2.onrender.com/api/v1';

export default function HotelDeliveryManagementPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchActiveDeliveries = async () => {
    if (!restaurantId || !accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Query active orders from backend
      const res = await fetch(`${getApiBase()}/orders?restaurantId=${restaurantId}&limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rawOrders = Array.isArray(data) ? data : data.orders ?? [];
        // Filter strictly to active delivery lifecycle states
        const activeOnly = rawOrders.filter((ord: any) =>
          [
            'READY_FOR_PICKUP',
            'DRIVER_ASSIGNED',
            'ARRIVED_AT_RESTAURANT',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
          ].includes(ord.status),
        );
        setActiveDeliveries(activeOnly);
        setLastRefreshed(new Date());
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDeliveries();

    if (!restaurantId) return;

    // Real-Time Socket.IO Synchronization
    const socketUrl = getApiBase().replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinRestaurant', { restaurantId });
    });

    socket.on('order.status_changed', () => {
      fetchActiveDeliveries();
    });

    socket.on('order.driver_assigned', () => {
      fetchActiveDeliveries();
    });

    socket.on('driver.location_updated', (payload: { orderId: string; lat: number; lng: number }) => {
      setActiveDeliveries((prev) =>
        prev.map((ord) => {
          if (ord.id === payload.orderId) {
            return {
              ...ord,
              tracking: {
                ...(ord.tracking || {}),
                currentLat: payload.lat,
                currentLng: payload.lng,
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return ord;
        }),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantId, accessToken]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return {
          label: 'READY IN KITCHEN',
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'DRIVER_ASSIGNED':
        return {
          label: 'RIDER ASSIGNED — EN ROUTE',
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
        };
      case 'ARRIVED_AT_RESTAURANT':
        return {
          label: 'RIDER AT RESTAURANT — PICKUP PENDING',
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        };
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'OUT FOR DELIVERY TO CUSTOMER',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              Live Delivery Operations Monitor
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time GPS tracking, assigned courier partner telemetry &amp; live customer destination feeds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gray-400 hidden sm:inline">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={fetchActiveDeliveries}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Delivery Monitoring Stream */}
      {isLoading && activeDeliveries.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-500">Connecting to live delivery gateway...</p>
        </div>
      ) : activeDeliveries.length === 0 ? (
        /* Authoritative Clean Empty State */
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-gray-900">No Active Deliveries En Route</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              All prepared orders have been delivered or are awaiting food preparation in the Kitchen Queue. When a courier partner is assigned to an order, their live GPS coordinates and delivery status will appear here automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {activeDeliveries.map((order) => {
            const badge = getStatusBadge(order.status);
            const driverInfo = order.deliveryJob?.driver || order.driver;
            const driverUser = driverInfo?.user;
            const driverProfile = driverUser?.profile;
            const driverName = driverProfile?.firstName
              ? `${driverProfile.firstName} ${driverProfile.lastName || ''}`.trim()
              : (driverInfo?.name || 'ZaykaFood Fleet Courier');
            const driverPhone = driverUser?.phone || driverInfo?.phone || null;

            const customerUser = order.customer?.user;
            const customerProfile = customerUser?.profile;
            const customerName = customerProfile?.firstName
              ? `${customerProfile.firstName} ${customerProfile.lastName || ''}`.trim()
              : (order.customerName || 'Customer');
            const customerPhone = customerUser?.phone || order.customerPhone || null;

            const deliveryAddress = order.deliveryAddress;
            const formattedCustomerAddress = typeof deliveryAddress === 'string'
              ? deliveryAddress
              : (deliveryAddress?.formattedAddress ||
                 [deliveryAddress?.addressLine1, deliveryAddress?.city].filter(Boolean).join(', ') ||
                 'Customer Destination Address');

            const customerLat = typeof deliveryAddress === 'object' && typeof deliveryAddress?.latitude === 'number'
              ? deliveryAddress.latitude
              : null;
            const customerLng = typeof deliveryAddress === 'object' && typeof deliveryAddress?.longitude === 'number'
              ? deliveryAddress.longitude
              : null;

            const driverLat = order.tracking?.currentLat ?? null;
            const driverLng = order.tracking?.currentLng ?? null;

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-6"
              >
                {/* Card Header: Order # & Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-purple-100 text-purple-800 px-3 py-1 text-xs font-black">
                      ORDER #{order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      ₹{order.totalAmount || 0}
                    </span>
                  </div>

                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Assigned Courier Partner Telemetry */}
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black">
                        <Bike className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                          Assigned Courier Partner
                        </span>
                        <h4 className="text-sm font-black text-gray-900">{driverName}</h4>
                      </div>
                    </div>

                    {driverPhone && (
                      <a
                        href={`tel:${driverPhone}`}
                        className="flex items-center gap-1 rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition shadow-sm"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        Call Rider
                      </a>
                    )}
                  </div>

                  {/* Telemetry / Live GPS */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block">CURRENT GPS</span>
                      <span className="font-mono text-[11px] font-bold text-gray-800">
                        {driverLat && driverLng
                          ? `${driverLat.toFixed(4)}, ${driverLng.toFixed(4)}`
                          : 'Awaiting first fix'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block">LAST TELEMETRY HEARTBEAT</span>
                      <span className="text-[11px] font-bold text-gray-800">
                        {order.tracking?.updatedAt
                          ? new Date(order.tracking.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'Active Signal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Destination & Routing Details */}
                <div className="space-y-3 text-xs">
                  {/* Restaurant Pickup Location */}
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                        Pickup Location
                      </span>
                      <p className="font-bold text-gray-800">
                        {order.restaurant?.name || 'Your Restaurant'} — {order.restaurant?.addressLine || 'Store Front'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Drop-off Location */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                          Customer Destination ({customerName})
                        </span>
                        <p className="font-bold text-gray-800">{formattedCustomerAddress}</p>
                      </div>
                    </div>

                    {customerLat && customerLng && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Map
                      </a>
                    )}
                  </div>
                </div>

                {/* Order Item Summary */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-bold mb-1.5">
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      Items in Transit ({(order.orderItems || []).reduce((acc: number, i: any) => acc + (i.quantity || 1), 0)})
                    </span>
                    <span>Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    {(order.orderItems || []).map((i: any) => `${i.quantity}x ${i.foodItem?.name || i.name || 'Item'}`).join(', ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
