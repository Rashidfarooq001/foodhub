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
  Star,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  QrCode,
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

  // Rider Selection Modal States
  const [assigningOrder, setAssigningOrder] = useState<OrderRecord | null>(null);
  const [eligibleRiders, setEligibleRiders] = useState<any[]>([]);
  const [isFetchingRiders, setIsFetchingRiders] = useState(false);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const [showUnavailableRiders, setShowUnavailableRiders] = useState(false);

  // Pickup OTP & QR Modal State
  const [pickupOtpModalOrder, setPickupOtpModalOrder] = useState<OrderRecord | null>(null);
  const [pickupOtpData, setPickupOtpData] = useState<{ pickupOtp?: string; qrToken?: string } | null>(null);
  const [isFetchingOtp, setIsFetchingOtp] = useState(false);

  const handleFetchPickupOtp = async (order: OrderRecord) => {
    setPickupOtpModalOrder(order);
    setIsFetchingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/pickup-otp`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPickupOtpData(data);
      } else {
        setPickupOtpData(null);
      }
    } catch {
      setPickupOtpData(null);
    } finally {
      setIsFetchingOtp(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : data.orders ?? [];

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

          const driverObj = o.assignedFoodHubDriver || o.deliveryJob?.driver;

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
            driverName: driverObj?.user?.profile ? `${driverObj.user.profile.firstName} ${driverObj.user.profile.lastName || ''}`.trim() : undefined,
            driverPhone: driverObj?.user?.phone,
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
    let msg = message || 'Order transition failed.';
    if (!message) {
      if (status === 400) msg = 'Invalid order transition requested.';
      else if (status === 401) msg = 'Session expired. Please log in again.';
      else if (status === 403) msg = 'Access denied. You do not have permission to manage this order.';
      else if (status === 409) msg = 'This order has already been accepted or modified by another user.';
      else if (status === 500) msg = 'Restaurant order service temporarily failed. Please try again.';
    }
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleAcceptOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToastError(res.status, errData.message);
        return;
      }
      await fetchOrders();
    } catch {
      showToastError(500);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartPreparing = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToastError(res.status, errData.message);
        return;
      }
      await fetchOrders();
    } catch {
      showToastError(500);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToastError(res.status, errData.message);
        return;
      }
      await fetchOrders();
    } catch {
      showToastError(500);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setProcessingId(rejectingOrder.id);
    const finalReason = rejectionReason === 'Other' ? customRejectionReason || 'Other' : rejectionReason;

    try {
      const res = await fetch(`${API_BASE}/orders/${rejectingOrder.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ reason: finalReason }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToastError(res.status, errData.message);
        return;
      }
      setRejectingOrder(null);
      await fetchOrders();
    } catch {
      showToastError(500);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenAssignRiderModal = async (order: OrderRecord) => {
    setAssigningOrder(order);
    setIsFetchingRiders(true);
    setEligibleRiders([]);
    setShowUnavailableRiders(false);
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/eligible-riders`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const ridersData = await res.json();
        setEligibleRiders(ridersData);
      }
    } catch {
      /* fetch fallback */
    } finally {
      setIsFetchingRiders(false);
    }
  };

  const handleAssignRider = async (driverId: string) => {
    if (!assigningOrder) return;
    setAssigningDriverId(driverId);
    try {
      const res = await fetch(`${API_BASE}/orders/${assigningOrder.id}/assign-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ driverId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToastError(res.status, errData.message || 'Failed to assign selected delivery partner.');
        return;
      }

      setAssigningOrder(null);
      await fetchOrders();
    } catch {
      showToastError(500, 'Selected rider is no longer available or assigned to another delivery.');
    } finally {
      setAssigningDriverId(null);
    }
  };

  const getFilteredOrders = () => {
    return orders.filter((o) => {
      if (filter === 'NEW_ORDERS' && o.status !== 'PENDING') return false;
      if (filter === 'ACCEPTED' && o.status !== 'ACCEPTED') return false;
      if (filter === 'PREPARING' && o.status !== 'PREPARING') return false;
      if (filter === 'READY_FOR_PICKUP' && o.status !== 'READY_FOR_PICKUP') return false;
      if (filter === 'OUT_FOR_DELIVERY' && !['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)) return false;
      if (filter === 'COMPLETED' && o.status !== 'DELIVERED') return false;
      if (filter === 'REJECTED_CANCELLED' && !['REJECTED', 'CANCELLED'].includes(o.status)) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const numMatch = o.orderNumber.toLowerCase().includes(s);
        const nameMatch = (o.customerName || '').toLowerCase().includes(s);
        const phoneMatch = (o.customerPhone || '').includes(s);
        return numMatch || nameMatch || phoneMatch;
      }

      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  const availableRidersList = eligibleRiders.filter((r) => r.isAvailable);
  const unavailableRidersList = eligibleRiders.filter((r) => !r.isAvailable);

  const getTabCount = (tab: FilterTab) => {
    return orders.filter((o) => {
      if (tab === 'NEW_ORDERS') return o.status === 'PENDING';
      if (tab === 'ACCEPTED') return o.status === 'ACCEPTED';
      if (tab === 'PREPARING') return o.status === 'PREPARING';
      if (tab === 'READY_FOR_PICKUP') return o.status === 'READY_FOR_PICKUP';
      if (tab === 'OUT_FOR_DELIVERY') return ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status);
      if (tab === 'COMPLETED') return o.status === 'DELIVERED';
      if (tab === 'REJECTED_CANCELLED') return ['REJECTED', 'CANCELLED'].includes(o.status);
      return true;
    }).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 animate-pulse">NEW ORDER</span>;
      case 'ACCEPTED':
        return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">ACCEPTED</span>;
      case 'PREPARING':
        return <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">PREPARING</span>;
      case 'READY_FOR_PICKUP':
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">READY FOR PICKUP</span>;
      case 'DRIVER_ASSIGNED':
        return <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-800">RIDER ASSIGNED</span>;
      case 'ARRIVED_AT_RESTAURANT':
        return <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800">RIDER ARRIVED</span>;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">OUT FOR DELIVERY</span>;
      case 'DELIVERED':
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-800">DELIVERED</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">{status}</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-900 shadow-lg animate-bounce">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-gray-900">Live Restaurant Orders</h1>
            <button
              onClick={fetchOrders}
              className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500 transition"
              title="Refresh Orders"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Realtime KDS order lifecycle control center • Click "ACCEPT ORDER" to begin preparing
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Operational Filter Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1.5 rounded-2xl text-xs font-bold scrollbar-none">
        {[
          { id: 'NEW_ORDERS', label: 'NEW ORDERS' },
          { id: 'ACCEPTED', label: 'ACCEPTED' },
          { id: 'PREPARING', label: 'PREPARING' },
          { id: 'READY_FOR_PICKUP', label: 'READY FOR PICKUP' },
          { id: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY' },
          { id: 'COMPLETED', label: 'COMPLETED' },
          { id: 'REJECTED_CANCELLED', label: 'REJECTED/CANCELLED' },
          { id: 'ALL', label: 'ALL ORDERS' },
        ].map((tab) => {
          const count = getTabCount(tab.id as FilterTab);
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isActive ? 'bg-orange-100 text-orange-700 font-black' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Card Grid (< 768px) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400 font-bold">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-bold">No orders found in this section.</div>
        ) : (
          filteredOrders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-black text-orange-600">ORDER #{o.orderNumber}</span>
                  <h3 className="text-sm font-black text-gray-900 mt-0.5">{o.customerName}</h3>
                  <p className="text-[11px] font-bold text-gray-500">{o.customerPhone}</p>
                </div>
                {getStatusBadge(o.status)}
              </div>

              <div className="rounded-2xl bg-gray-50 p-3 space-y-1.5 text-xs">
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
                  <Eye className="h-3.5 w-3.5" /> Details
                </button>
              </div>

              {/* ACTION BUTTONS ON MOBILE CARDS */}
              <div className="pt-2 space-y-2">
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

                {['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status) && (
                  <button
                    onClick={() => handleOpenAssignRiderModal(o)}
                    className="w-full rounded-2xl bg-purple-600 py-2.5 text-xs font-black text-white shadow-md hover:bg-purple-700 flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="h-4 w-4" /> SELECT &amp; ASSIGN RIDER
                  </button>
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
                    <td className="px-6 py-4 font-black text-orange-600">
                      #{o.orderNumber}
                      <span className="block text-[10px] font-bold text-gray-400 mt-0.5">{o.placedAt}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">{o.customerName}</p>
                      <p className="text-[11px] text-gray-500 font-bold">{o.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-bold text-gray-900">{i.quantity}x</span> {i.name}
                          {i.variant && (
                            <span className="ml-1 text-[10px] text-orange-600 font-bold">({typeof i.variant === 'string' ? i.variant : i.variant.name})</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      ₹{o.totalAmount}
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">{o.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(o.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
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

                        {/* SELECT & ASSIGN RIDER ACTION */}
                        {['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status) && (
                          <button
                            onClick={() => handleOpenAssignRiderModal(o)}
                            className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-purple-700 flex items-center gap-1 shrink-0"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> SELECT RIDER
                          </button>
                        )}

                        {['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT'].includes(o.status) && (
                          <button
                            onClick={() => handleFetchPickupOtp(o)}
                            className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-amber-700 flex items-center gap-1 shrink-0"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> PICKUP CODE &amp; QR
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIDER SELECTION MODAL */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">RESTAURANT RIDER ASSIGNMENT</span>
                <h3 className="text-lg font-black text-gray-900">Select FoodHub Partner for #{assigningOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setAssigningOrder(null)} className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isFetchingRiders ? (
              <div className="py-12 text-center text-xs font-bold text-gray-400">Searching nearby eligible FoodHub riders...</div>
            ) : (
              <div className="space-y-4">
                {/* SECTION 1: AVAILABLE FOODHUB RIDERS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Available FoodHub Riders ({availableRidersList.length})
                  </h4>

                  {availableRidersList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center space-y-2">
                      <Bike className="h-8 w-8 mx-auto text-gray-300" />
                      <p className="text-xs font-bold text-gray-700">No FoodHub riders are currently available nearby.</p>
                      <p className="text-[11px] text-gray-400">FoodHub platform fleet will auto-dispatch as soon as a delivery partner becomes online.</p>
                    </div>
                  ) : (
                    availableRidersList.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 hover:border-emerald-300 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={r.avatar}
                            alt={r.name}
                            className="h-12 w-12 rounded-2xl object-cover border border-white shadow-sm shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-gray-900">{r.name}</h4>
                              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5">
                                ONLINE
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-bold mt-0.5">
                              {r.vehicleType} • {r.vehicleNumber} • {r.phone}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 mt-1">
                              <span className="text-amber-600 font-black">★ {r.rating}</span>
                              <span>{r.completedCount} deliveries completed</span>
                              <span className="text-emerald-700 font-bold">{r.distanceKm} km away</span>
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={assigningDriverId === r.id}
                          onClick={() => handleAssignRider(r.driverId)}
                          className="w-full sm:w-auto shrink-0 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
                        >
                          {assigningDriverId === r.id ? 'Assigning...' : 'ASSIGN RIDER'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* SECTION 2: OPTIONAL EXPANDABLE UNAVAILABLE RIDERS */}
                {unavailableRidersList.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => setShowUnavailableRiders(!showUnavailableRiders)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-800 py-1"
                    >
                      <span>Unavailable Riders ({unavailableRidersList.length})</span>
                      {showUnavailableRiders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showUnavailableRiders && (
                      <div className="space-y-2 mt-2">
                        {unavailableRidersList.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 opacity-75"
                          >
                            <div className="flex items-center gap-3">
                              <img src={r.avatar} alt={r.name} className="h-9 w-9 rounded-xl object-cover" />
                              <div>
                                <h5 className="text-xs font-bold text-gray-800">{r.name}</h5>
                                <p className="text-[10px] text-gray-500">{r.vehicleType} • {r.phone}</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1">
                              {r.unavailabilityReason || r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                onClick={handleConfirmReject}
                className="flex-1 rounded-2xl bg-rose-600 py-3 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {processingId === rejectingOrder.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">ORDER DETAILS</span>
                <h3 className="text-xl font-black text-gray-900">Order #{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4 text-xs font-bold">
              <div>
                <span className="text-[10px] uppercase text-gray-400 block font-bold">Customer</span>
                <span className="text-gray-900 font-black text-sm">{selectedOrder.customerName}</span>
                <p className="text-gray-500 font-bold">{selectedOrder.customerPhone}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400 block font-bold">Status</span>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-900 uppercase">Delivery Address</h4>
              <div className="flex items-start gap-2 text-xs text-gray-600 font-medium rounded-2xl border border-gray-100 p-3 bg-gray-50/50">
                <MapPin className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <span>{selectedOrder.customerAddress}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-900 uppercase">Items Ordered</h4>
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 p-4 text-xs">
                {selectedOrder.items.map((i, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-900">{i.quantity}x {i.name}</p>
                      {i.variant && (
                        <p className="text-[10px] text-orange-600 font-bold">Variant: {typeof i.variant === 'string' ? i.variant : i.variant.name}</p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900">₹{i.price * i.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Delivery Fee</span>
                <span>₹{selectedOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Taxes &amp; Fees</span>
                <span>₹{selectedOrder.taxAmount}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Amount ({selectedOrder.paymentMethod})</span>
                <span className="text-orange-600">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PICKUP OTP & QR CODE MODAL */}
      {pickupOtpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">ORDER HANDOVER VERIFICATION</span>
                <h3 className="text-lg font-black text-gray-900">Pickup Code for #{pickupOtpModalOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setPickupOtpModalOrder(null)} className="rounded-full p-1.5 hover:bg-gray-100 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isFetchingOtp ? (
              <div className="py-8 text-center text-xs font-bold text-gray-400">Generating secure 4-digit handover code...</div>
            ) : pickupOtpData ? (
              <div className="space-y-6 text-center">
                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Provide this 4-digit code to rider:</span>
                  <div className="text-4xl font-black tracking-widest text-amber-900 font-mono">
                    {pickupOtpData.pickupOtp}
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium">
                    The courier will enter this code on their app to verify order package receipt.
                  </p>
                </div>

                {pickupOtpData.qrToken && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase block">OR Signed QR Verification Token</span>
                    <div className="rounded-2xl bg-gray-900 p-4 text-[10px] font-mono text-emerald-400 break-all select-all shadow-inner">
                      {pickupOtpData.qrToken}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-bold text-rose-600">
                Failed to load pickup verification code. Ensure rider has been assigned to order.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
