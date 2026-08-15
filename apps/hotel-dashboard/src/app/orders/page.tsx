'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Utensils,
  Bike,
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  User,
  X,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { io } from 'socket.io-client';

const API_BASE = getApiBaseUrl();

type FilterTab =
  | 'NEW_ORDERS'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'REJECTED_CANCELLED'
  | 'ALL';

interface OrderItemVariant {
  name: string;
  price?: number;
}

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  variant?: OrderItemVariant | string;
  notes?: string;
  addons?: Array<{ name: string; price: number }>;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  placedAt?: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryAddress?: any;
  deliveryInstructions?: string;
  distanceKm?: number;
  driverName?: string;
  driverPhone?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  items: OrderItem[];
}

export default function HotelOrdersPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filter, setFilter] = useState<FilterTab>('NEW_ORDERS');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<OrderRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Restaurant too busy');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : data.orders ?? [];

        // Format order items and human-readable addresses
        const formatted: OrderRecord[] = rawList.map((o: any) => {
          let addrStr = 'Address not available';
          if (o.deliveryAddress) {
            if (typeof o.deliveryAddress === 'string') {
              addrStr = o.deliveryAddress;
            } else {
              const a = o.deliveryAddress;
              const parts = [a.street, a.landmark, a.city, a.state, a.postalCode].filter(Boolean);
              addrStr = parts.length > 0 ? parts.join(', ') : a.label || 'Customer Location';
            }
          }

          const itemsArr: OrderItem[] = (o.items || []).map((i: any) => ({
            id: i.id,
            name: i.foodItem?.name || i.name || 'Food Item',
            quantity: i.quantity || 1,
            price: Number(i.unitPrice || i.price || 0),
            variant: i.variantName || i.variant || (i.selectedVariant ? i.selectedVariant.name : undefined),
            notes: i.instructions || i.notes,
            addons: i.addons,
          }));

          return {
            id: o.id,
            orderNumber: o.orderNumber || o.id.substring(0, 8),
            status: o.status,
            subtotal: Number(o.subtotal || 0),
            taxAmount: Number(o.taxAmount || 0),
            deliveryFee: Number(o.deliveryFee || 0),
            totalAmount: Number(o.totalAmount || 0),
            paymentMethod: o.paymentMethod || 'COD',
            paymentStatus: o.paymentStatus || 'PENDING',
            createdAt: o.createdAt || new Date().toISOString(),
            placedAt: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            customerName: o.customer?.profile ? `${o.customer.profile.firstName || ''} ${o.customer.profile.lastName || ''}`.trim() : o.customerName || 'Customer',
            customerPhone: o.customer?.user?.phone || o.customerPhone || '',
            customerAddress: addrStr,
            deliveryAddress: o.deliveryAddress,
            deliveryInstructions: o.deliveryInstructions,
            distanceKm: o.deliveryJob?.distanceKm || o.distanceKm || undefined,
            driverName: o.deliveryJob?.driver?.user?.profile ? `${o.deliveryJob.driver.user.profile.firstName} ${o.deliveryJob.driver.user.profile.lastName || ''}`.trim() : undefined,
            driverPhone: o.deliveryJob?.driver?.user?.phone,
            cancellationReason: o.cancellationReason,
            rejectionReason: o.rejectionReason,
            items: itemsArr,
          };
        });

        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch + Socket.IO realtime setup
  useEffect(() => {
    fetchOrders();

    const socketUrl = API_BASE.replace('/api/v1', '');
    const socket = io(`${socketUrl}/orders`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (restaurantId) {
        socket.emit('joinRestaurant', { restaurantId });
      }
    });

    const handleRealtimeUpdate = () => {
      fetchOrders();
    };

    socket.on('order.created', handleRealtimeUpdate);
    socket.on('order.status-changed', handleRealtimeUpdate);
    socket.on('status.updated', handleRealtimeUpdate);
    socket.on('delivery.assigned', handleRealtimeUpdate);
    socket.on('delivery.job-available', handleRealtimeUpdate);

    return () => {
      socket.disconnect();
    };
  }, [accessToken, restaurantId]);

  const showToastError = (status: number, message?: string) => {
    let msg = 'Order transition failed.';
    if (status === 400) msg = message || 'Invalid order transition requested.';
    else if (status === 401) msg = 'Session expired. Please log in again.';
    else if (status === 403) msg = 'Access denied. You do not have permission to manage this order.';
    else if (status === 409) msg = 'This order has already been accepted or modified by another user.';
    else if (status === 500) msg = 'Restaurant order service temporarily failed. Please try again.';

    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // Transitions
  const handleAcceptOrder = async (orderId: string) => {
    setProcessingId(orderId);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToastError(res.status, err.message);
        return;
      }
      await fetchOrders();
    } catch {
      showToastError(0, 'Network error accepting order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmRejectOrder = async () => {
    if (!rejectingOrder) return;
    const finalReason = rejectionReason === 'Other' ? customRejectionReason || 'Rejected by restaurant' : rejectionReason;
    setProcessingId(rejectingOrder.id);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${rejectingOrder.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: finalReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToastError(res.status, err.message);
        return;
      }
      setRejectingOrder(null);
      await fetchOrders();
    } catch {
      showToastError(0, 'Network error rejecting order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartPreparing = async (orderId: string) => {
    setProcessingId(orderId);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/prepare`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToastError(res.status, err.message);
        return;
      }
      await fetchOrders();
    } catch {
      showToastError(0, 'Network error starting preparation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setProcessingId(orderId);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/ready`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToastError(res.status, err.message);
        return;
      }
      await fetchOrders();
    } catch {
      showToastError(0, 'Network error marking ready');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter Logic
  let filteredOrders = [...orders];

  if (filter === 'NEW_ORDERS') {
    filteredOrders = filteredOrders.filter((o) => o.status === 'PENDING');
  } else if (filter === 'ACCEPTED') {
    filteredOrders = filteredOrders.filter((o) => o.status === 'ACCEPTED');
  } else if (filter === 'PREPARING') {
    filteredOrders = filteredOrders.filter((o) => o.status === 'PREPARING');
  } else if (filter === 'READY_FOR_PICKUP') {
    filteredOrders = filteredOrders.filter((o) => o.status === 'READY_FOR_PICKUP');
  } else if (filter === 'OUT_FOR_DELIVERY') {
    filteredOrders = filteredOrders.filter((o) =>
      ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
  } else if (filter === 'COMPLETED') {
    filteredOrders = filteredOrders.filter((o) => o.status === 'DELIVERED');
  } else if (filter === 'REJECTED_CANCELLED') {
    filteredOrders = filteredOrders.filter((o) =>
      ['REJECTED', 'CANCELLED', 'FAILED', 'REFUNDED'].includes(o.status)
    );
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filteredOrders = filteredOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q))
    );
  }

  // Count helper
  const countByTab = (tab: FilterTab) => {
    if (tab === 'ALL') return orders.length;
    if (tab === 'NEW_ORDERS') return orders.filter((o) => o.status === 'PENDING').length;
    if (tab === 'ACCEPTED') return orders.filter((o) => o.status === 'ACCEPTED').length;
    if (tab === 'PREPARING') return orders.filter((o) => o.status === 'PREPARING').length;
    if (tab === 'READY_FOR_PICKUP') return orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;
    if (tab === 'OUT_FOR_DELIVERY')
      return orders.filter((o) => ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
    if (tab === 'COMPLETED') return orders.filter((o) => o.status === 'DELIVERED').length;
    if (tab === 'REJECTED_CANCELLED')
      return orders.filter((o) => ['REJECTED', 'CANCELLED', 'FAILED', 'REFUNDED'].includes(o.status)).length;
    return 0;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800 animate-pulse">NEW ORDER</span>;
      case 'ACCEPTED':
        return <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-black text-blue-800">ACCEPTED</span>;
      case 'PREPARING':
        return <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black text-orange-800">COOKING</span>;
      case 'READY_FOR_PICKUP':
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800">READY FOR PICKUP</span>;
      case 'DRIVER_ASSIGNED':
      case 'ARRIVED_AT_RESTAURANT':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-black text-indigo-800">OUT FOR DELIVERY</span>;
      case 'DELIVERED':
        return <span className="rounded-full bg-emerald-600 text-white px-3 py-1 text-[11px] font-black">DELIVERED</span>;
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
        return <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black text-rose-800">{status}</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Restaurant Order Lifecycle Manager</h1>
            {countByTab('NEW_ORDERS') > 0 && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white animate-bounce">
                {countByTab('NEW_ORDERS')} NEW
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">Real-time order acceptance, preparation queue &amp; rider handoff control</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 shrink-0"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
            Refresh Queue
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order # or customer..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error Toast Notification Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(
          [
            { id: 'NEW_ORDERS', label: 'NEW ORDERS', color: 'bg-amber-500 text-white' },
            { id: 'ACCEPTED', label: 'ACCEPTED', color: 'bg-blue-600 text-white' },
            { id: 'PREPARING', label: 'PREPARING', color: 'bg-orange-600 text-white' },
            { id: 'READY_FOR_PICKUP', label: 'READY FOR PICKUP', color: 'bg-emerald-600 text-white' },
            { id: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY', color: 'bg-indigo-600 text-white' },
            { id: 'COMPLETED', label: 'COMPLETED', color: 'bg-emerald-700 text-white' },
            { id: 'REJECTED_CANCELLED', label: 'REJECTED / CANCELLED', color: 'bg-rose-600 text-white' },
            { id: 'ALL', label: 'ALL ORDERS', color: 'bg-gray-900 text-white' },
          ] as const
        ).map((tab) => {
          const count = countByTab(tab.id);
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shrink-0 min-h-[40px] ${
                isActive
                  ? `${tab.color} shadow-md`
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            Loading live orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            No orders found in {filter.replace('_', ' ')}.
          </div>
        ) : (
          filteredOrders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-sm font-black text-gray-900">{o.orderNumber}</span>
                  <p className="text-[10px] text-gray-400">{o.placedAt}</p>
                </div>
                {getStatusBadge(o.status)}
              </div>

              <div>
                <p className="text-xs font-black text-gray-900">{o.customerName}</p>
                <p className="text-[11px] text-gray-500 font-medium">{o.customerPhone}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{o.customerAddress}</p>
              </div>

              {/* Items Summary */}
              <div className="rounded-2xl bg-gray-50 p-3 space-y-1.5 text-xs text-gray-800">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>
                      <strong className="text-gray-900">{i.quantity}x</strong> {i.name}
                      {i.variant && (
                        <span className="ml-1 text-[10px] text-orange-600 font-bold">({typeof i.variant === 'string' ? i.variant : i.variant.name})</span>
                      )}
                    </span>
                    <span className="font-bold text-gray-900">₹{i.price * i.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs font-black text-gray-900 border-t border-gray-100 pt-3">
                <span>Total: ₹{o.totalAmount} ({o.paymentMethod})</span>
                <button
                  onClick={() => setSelectedOrder(o)}
                  className="flex items-center gap-1 text-xs text-orange-600 font-bold hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </button>
              </div>

              {/* ACTION BUTTONS ON MOBILE CARDS */}
              <div className="pt-2">
                {o.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      disabled={processingId === o.id}
                      onClick={() => handleAcceptOrder(o.id)}
                      className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {processingId === o.id ? 'Accepting...' : 'ACCEPT ORDER'}
                    </button>
                    <button
                      disabled={processingId === o.id}
                      onClick={() => setRejectingOrder(o)}
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      REJECT
                    </button>
                  </div>
                )}

                {o.status === 'ACCEPTED' && (
                  <button
                    disabled={processingId === o.id}
                    onClick={() => handleStartPreparing(o.id)}
                    className="w-full rounded-2xl bg-orange-600 py-3 text-xs font-black text-white shadow-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {processingId === o.id ? 'Updating...' : 'START PREPARING'}
                  </button>
                )}

                {o.status === 'PREPARING' && (
                  <button
                    disabled={processingId === o.id}
                    onClick={() => handleMarkReady(o.id)}
                    className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processingId === o.id ? 'Updating...' : 'MARK READY FOR PICKUP'}
                  </button>
                )}

                {o.status === 'READY_FOR_PICKUP' && (
                  <div className="w-full rounded-2xl bg-emerald-50 border border-emerald-200 py-2.5 text-center text-xs font-bold text-emerald-800">
                    Awaiting Delivery Partner
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View Table (>= 768px) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items &amp; Variants</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders found matching filter criteria.</td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">{o.orderNumber}</p>
                      <p className="text-[10px] text-gray-400">{o.placedAt}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-gray-900">{o.customerName}</p>
                      <p className="text-[10px] text-gray-400">{o.customerPhone}</p>
                      <p className="text-[10px] text-gray-400 truncate">{o.customerAddress}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        {o.items.map((i, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-black text-gray-900">{i.quantity}x</span> {i.name}
                            {i.variant && (
                              <span className="ml-1 text-[10px] font-bold text-orange-600">
                                ({typeof i.variant === 'string' ? i.variant : i.variant.name})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">₹{o.totalAmount}</p>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{o.paymentMethod} • {o.paymentStatus}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(o.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* PENDING ACTIONS */}
                        {o.status === 'PENDING' && (
                          <>
                            <button
                              disabled={processingId === o.id}
                              onClick={() => handleAcceptOrder(o.id)}
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 shrink-0"
                            >
                              {processingId === o.id ? 'Accepting...' : 'ACCEPT ORDER'}
                            </button>
                            <button
                              disabled={processingId === o.id}
                              onClick={() => setRejectingOrder(o)}
                              className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 shrink-0"
                            >
                              REJECT
                            </button>
                          </>
                        )}

                        {/* ACCEPTED ACTION */}
                        {o.status === 'ACCEPTED' && (
                          <button
                            disabled={processingId === o.id}
                            onClick={() => handleStartPreparing(o.id)}
                            className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 shrink-0"
                          >
                            {processingId === o.id ? 'Updating...' : 'START PREPARING'}
                          </button>
                        )}

                        {/* PREPARING ACTION */}
                        {o.status === 'PREPARING' && (
                          <button
                            disabled={processingId === o.id}
                            onClick={() => handleMarkReady(o.id)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 shrink-0"
                          >
                            {processingId === o.id ? 'Updating...' : 'MARK READY FOR PICKUP'}
                          </button>
                        )}

                        {/* READY_FOR_PICKUP BADGE */}
                        {o.status === 'READY_FOR_PICKUP' && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            Awaiting Rider
                          </span>
                        )}

                        {/* OUT FOR DELIVERY / DELIVERED */}
                        {['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'].includes(o.status) && (
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1 shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="h-6 w-6" />
                <h3 className="text-lg font-black text-gray-900">Reject Order #{rejectingOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setRejectingOrder(null)} className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Please select a valid reason for rejecting this order. The customer will be notified immediately.
            </p>

            <div className="space-y-2 text-xs font-bold text-gray-700">
              {['Restaurant too busy', 'Item unavailable', 'Restaurant closing', 'Delivery unavailable', 'Other'].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                    rejectionReason === r ? 'border-rose-500 bg-rose-50/40 text-rose-900' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={r}
                    checked={rejectionReason === r}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="accent-rose-600"
                  />
                  <span>{r}</span>
                </label>
              ))}

              {rejectionReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter specific reason..."
                  value={customRejectionReason}
                  onChange={(e) => setCustomRejectionReason(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold focus:border-rose-500 focus:outline-none mt-2"
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === rejectingOrder.id}
                onClick={handleConfirmRejectOrder}
                className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white hover:bg-rose-700 shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {processingId === rejectingOrder.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">ORDER DETAILS</span>
                <h2 className="text-xl font-black text-gray-900">{selectedOrder.orderNumber}</h2>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedOrder.status)}
                <button onClick={() => setSelectedOrder(null)} className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Customer Info */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Customer Information</span>
                <p className="font-black text-gray-900 text-sm">{selectedOrder.customerName}</p>
                <p className="font-bold text-gray-600 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-orange-600" /> {selectedOrder.customerPhone || 'N/A'}
                </p>
                <p className="text-gray-500 flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{selectedOrder.customerAddress}</span>
                </p>
                {selectedOrder.deliveryInstructions && (
                  <p className="text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-bold text-[11px]">
                    Instructions: {selectedOrder.deliveryInstructions}
                  </p>
                )}
              </div>

              {/* Payment & Logistics */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Payment &amp; Logistics</span>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-black text-gray-900">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-black text-emerald-600">{selectedOrder.paymentStatus}</span>
                </div>
                {selectedOrder.distanceKm && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Distance:</span>
                    <span className="font-black text-gray-900">{selectedOrder.distanceKm} km</span>
                  </div>
                )}
                {selectedOrder.driverName && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">Assigned Rider</span>
                    <p className="font-black text-gray-900">{selectedOrder.driverName}</p>
                    <p className="text-[11px] text-gray-500">{selectedOrder.driverPhone || ''}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Order Items</span>
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden divide-y divide-gray-100">
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-gray-900">
                        {i.quantity}x {i.name}
                        {i.variant && (
                          <span className="ml-1 text-[11px] font-bold text-orange-600">
                            ({typeof i.variant === 'string' ? i.variant : i.variant.name})
                          </span>
                        )}
                      </p>
                      {i.notes && <p className="text-[10px] text-amber-600 italic">Notes: {i.notes}</p>}
                    </div>
                    <span className="font-black text-gray-900">₹{i.price * i.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-2xl bg-gray-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Food Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes &amp; Statutory Charges</span>
                <span>₹{selectedOrder.taxAmount}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{selectedOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-2">
                <span>Customer Total</span>
                <span className="text-orange-600 text-base">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
