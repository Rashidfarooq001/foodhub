'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Bike,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { useKitchenStore } from '../../stores/use-kitchen-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

export default function KitchenQueuePage() {
  const { queue, setQueue } = useKitchenStore();
  const { accessToken, user } = useHotelAuthStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const pending = queue.filter((q) => (q.status as string) === 'PENDING');
  const preparing = queue.filter((q) => (q.status as string) === 'PREPARING' || (q.status as string) === 'ACCEPTED');
  const ready = queue.filter((q) => (q.status as string) === 'READY_FOR_PICKUP');

  const refreshOrders = async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/orders?status=PENDING,ACCEPTED,PREPARING,READY_FOR_PICKUP`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(Array.isArray(data) ? data : data.orders ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsRefreshing(false);
    }
  };

  const restaurantId = user?.restaurantId;

  useEffect(() => {
    refreshOrders();

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (restaurantId) {
        socket.emit('joinRestaurant', { restaurantId });
      }
    });

    const handleUpdate = () => {
      refreshOrders();
    };

    socket.on('order.created', handleUpdate);
    socket.on('status.updated', handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [accessToken, restaurantId]);

  const acceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await refreshOrders();
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    const reason = prompt('Please enter a rejection reason:') || 'Kitchen busy / item out of stock';
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await refreshOrders();
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  };

  const prepareOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/prepare`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await refreshOrders();
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  };

  const markReadyOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await refreshOrders();
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderOrderCard = (order: any, stage: 'PENDING' | 'PREPARING' | 'READY') => {
    const items = order.items || order.orderItems || [];
    const isLoading = actionLoadingId === order.id;

    return (
      <div
        key={order.id}
        className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-gray-900">
                #{order.orderNumber || order.id.slice(0, 8)}
              </span>
              <span className="rounded-lg bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-black text-orange-800 uppercase">
                {order.deliveryMode === 'DIRECT_DELIVERY' || order.deliveryMode === 'RESTAURANT_DELIVERY' ? 'Self Delivery' : 'Zayka Delivery'}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-700 mt-0.5">
              {order.customerName || 'Customer'} {order.customerPhone ? `• ${order.customerPhone}` : ''}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-800">
              ₹{order.totalAmount || order.payableAmount || 0}
            </span>
            <span className="block text-[9px] text-gray-400 font-semibold mt-0.5">
              {order.paymentStatus || 'PAID'}
            </span>
          </div>
        </div>

        {/* Item List with Variants */}
        <div className="space-y-1.5 py-1">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex items-start justify-between text-xs gap-2">
              <div className="font-bold text-gray-900">
                <span className="text-orange-600 font-black mr-1">{item.quantity}×</span>
                <span>{item.name || item.foodItem?.name}</span>
                {item.variantName && (
                  <span className="ml-1.5 inline-block text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-md">
                    {item.variantName}
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-500 shrink-0">
                ₹{item.price || item.unitPrice || 0}
              </span>
            </div>
          ))}

          {order.notes && (
            <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl border border-amber-100 font-medium italic mt-2">
              Note: {order.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100">
          {stage === 'PENDING' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => acceptOrder(order.id)}
                disabled={isLoading}
                className="flex items-center justify-center rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 transition min-h-[44px]"
              >
                {isLoading ? 'Accepting...' : 'ACCEPT ORDER'}
              </button>
              <button
                onClick={() => rejectOrder(order.id)}
                disabled={isLoading}
                className="flex items-center justify-center rounded-2xl border border-rose-200 hover:bg-rose-50 py-3 text-xs font-bold text-rose-600 transition min-h-[44px]"
              >
                Reject
              </button>
            </div>
          )}

          {stage === 'PREPARING' && (
            <div className="space-y-2">
              <button
                onClick={() => markReadyOrder(order.id)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/20 transition min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isLoading ? 'Updating...' : 'MARK READY FOR PICKUP'}</span>
              </button>
            </div>
          )}

          {stage === 'READY' && (
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 py-3 text-xs font-black text-emerald-800 min-h-[44px]">
              <Bike className="h-4 w-4 text-emerald-600 animate-bounce" />
              <span>Awaiting Delivery Partner Pickup</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Kitchen Display System</span>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Real-time order ticket processing for kitchen staff
          </p>
        </div>

        <button
          onClick={refreshOrders}
          disabled={isRefreshing}
          className="self-start sm:self-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Mobile Stream Filter Tabs */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[44px] ${
            activeTab === 'ALL'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[44px] ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          New ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('PREPARING')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[44px] ${
            activeTab === 'PREPARING'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-orange-800 border border-orange-200'
          }`}
        >
          Cooking ({preparing.length})
        </button>
        <button
          onClick={() => setActiveTab('READY')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[44px] ${
            activeTab === 'READY'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          Ready ({ready.length})
        </button>
      </div>

      {/* Mobile Single Stream Presentation */}
      <div className="block lg:hidden space-y-3">
        {queue.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <Utensils className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            No active orders in kitchen queue.
          </div>
        ) : (
          <>
            {(activeTab === 'ALL' || activeTab === 'PENDING') && pending.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>New Orders ({pending.length})</span>
                </div>
                {pending.map((o) => renderOrderCard(o, 'PENDING'))}
              </div>
            )}

            {(activeTab === 'ALL' || activeTab === 'PREPARING') && preparing.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-orange-900 uppercase">
                  <Utensils className="h-4 w-4 text-orange-600" />
                  <span>Cooking in Progress ({preparing.length})</span>
                </div>
                {preparing.map((o) => renderOrderCard(o, 'PREPARING'))}
              </div>
            )}

            {(activeTab === 'ALL' || activeTab === 'READY') && ready.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Ready for Driver ({ready.length})</span>
                </div>
                {ready.map((o) => renderOrderCard(o, 'READY'))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop 3-Column Kanban Layout */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        {/* Column 1: New / Pending */}
        <div className="rounded-3xl border border-amber-200 bg-amber-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-black text-amber-900 uppercase tracking-wide">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>New Orders ({pending.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-gray-400">No new orders</div>
            ) : (
              pending.map((o) => renderOrderCard(o, 'PENDING'))
            )}
          </div>
        </div>

        {/* Column 2: Cooking */}
        <div className="rounded-3xl border border-orange-200 bg-orange-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-orange-200 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-black text-orange-900 uppercase tracking-wide">
              <Utensils className="h-4 w-4 text-orange-600" />
              <span>Cooking ({preparing.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {preparing.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-gray-400">No items cooking</div>
            ) : (
              preparing.map((o) => renderOrderCard(o, 'PREPARING'))
            )}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-black text-emerald-900 uppercase tracking-wide">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Ready for Driver ({ready.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {ready.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-gray-400">No orders waiting</div>
            ) : (
              ready.map((o) => renderOrderCard(o, 'READY'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}