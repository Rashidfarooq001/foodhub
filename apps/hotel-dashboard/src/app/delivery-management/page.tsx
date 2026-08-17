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
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

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
      const res = await fetch(`${API_BASE}/orders?restaurantId=${restaurantId}&limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rawOrders = Array.isArray(data) ? data : data.orders ?? [];
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
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDeliveries();

    if (!restaurantId) return;

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('joinRestaurant', { restaurantId });
    });

    const handleUpdate = () => {
      fetchActiveDeliveries();
    };

    socket.on('order.status_changed', handleUpdate);
    socket.on('order.driver_assigned', handleUpdate);
    socket.on('ORDER_STATUS_CHANGED', handleUpdate);

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
                lastPingAt: new Date().toISOString(),
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
  }, [accessToken, restaurantId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return {
          label: 'Awaiting Driver',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'DRIVER_ASSIGNED':
      case 'ARRIVED_AT_RESTAURANT':
        return {
          label: 'Driver at Store',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Out for Delivery',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          label: status,
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Delivery Tracking</span>
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {activeDeliveries.length} Active in Transit
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Real-time delivery partner tracking &amp; order fulfillment status
          </p>
        </div>

        <button
          onClick={fetchActiveDeliveries}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Tracking</span>
        </button>
      </div>

      {/* Main Delivery Tracking List Cards */}
      {isLoading ? (
        <div className="py-16 text-center text-xs font-bold text-gray-400">
          Loading live active deliveries...
        </div>
      ) : activeDeliveries.length === 0 ? (
        <div className="py-16 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 p-6 space-y-2">
          <Bike className="h-10 w-10 mx-auto text-gray-300 mb-1" />
          <p className="text-sm font-black text-gray-700">No Orders in Transit</p>
          <p className="text-gray-400 max-w-sm mx-auto">
            When kitchen orders are marked ready and assigned to courier partners, live GPS tracking cards will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {activeDeliveries.map((delivery) => {
            const statusInfo = getStatusBadge(delivery.status);
            const driver = delivery.driver || delivery.driverAssignment?.driver;
            const driverPhone = driver?.user?.phone || driver?.phone;
            const customerAddress = delivery.deliveryAddress || delivery.address;
            const destinationLat = customerAddress?.latitude || delivery.deliveryLat;
            const destinationLng = customerAddress?.longitude || delivery.deliveryLng;

            return (
              <div
                key={delivery.id}
                className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Order Top Bar */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        #{delivery.orderNumber || delivery.id.slice(0, 8)}
                      </span>
                      <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                        Customer: {delivery.customerName || 'Customer'}
                      </p>
                    </div>

                    <span className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase border ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Driver Info Card */}
                  <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Bike className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-900 block truncate max-w-[140px]">
                          {driver?.user?.profile?.firstName ? `${driver.user.profile.firstName} ${driver.user.profile.lastName || ''}` : driver?.name || 'Assigned Rider'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          {driver?.vehicleNumber || 'KA-01-HA-9821'}
                        </span>
                      </div>
                    </div>

                    {driverPhone && (
                      <a
                        href={`tel:${driverPhone}`}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition min-h-[40px]"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  {/* Delivery Destination */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-start gap-1.5 text-gray-700 font-medium">
                      <MapPin className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {customerAddress?.formattedAddress || customerAddress?.street || 'Delivery Address specified by customer'}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-2.5 rounded-xl bg-orange-50/30 border border-orange-100 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-1">
                      <Package className="h-3.5 w-3.5 text-orange-600" />
                      <span>Items in Package ({delivery.items?.length || 1}):</span>
                    </div>
                    <p className="text-[11px] text-gray-600 truncate">
                      {delivery.items?.map((it: any) => `${it.quantity}× ${it.name}`).join(', ') || 'Food order items'}
                    </p>
                  </div>
                </div>

                {/* External Navigation Link if destination coords exist */}
                {destinationLat && destinationLng && (
                  <div className="pt-2 border-t border-gray-100">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 py-2.5 text-xs font-bold text-gray-700 transition min-h-[40px]"
                    >
                      <Navigation className="h-3.5 w-3.5 text-blue-600" />
                      <span>View Route on Maps</span>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
