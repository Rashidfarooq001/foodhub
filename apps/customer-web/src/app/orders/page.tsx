'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Store,
  FileText,
  MapPin,
  Sparkles,
  AlertCircle,
  Eye,
  Star,
} from 'lucide-react';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { useAuthStore } from '../../stores/use-auth-store';
import { useCartStore } from '../../stores/use-cart-store';
import { getApiBaseUrl } from '@foodhub/config';
import { useRouter } from 'next/navigation';

const API_BASE = getApiBaseUrl();

interface OrderItemSummary {
  id: string;
  orderNumber: string;
  restaurantName: string;
  restaurantBanner?: string;
  date: string;
  createdAt: string;
  totalAmount: number;
  itemCount: number;
  itemsSummary: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  cancellationReason?: string;
  isRefunded?: boolean;
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const { addItem, clearCart } = useCartStore();
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<OrderItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');

  const fetchOrders = async () => {
    try {
      const { accessToken } = useAuthStore.getState();
      const headers: Record<string, string> = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};

      const [activeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/orders/active`, { headers }),
        fetch(`${API_BASE}/orders/history?status=${activeTab}`, { headers }),
      ]);

      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveOrder(data);
      } else {
        setActiveOrder(null);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleReorder = async (orderId: string) => {
    try {
      const { accessToken } = useAuthStore.getState();
      const headers: Record<string, string> = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {};
      const res = await fetch(`${API_BASE}/orders/${orderId}/repeat`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.items && Array.isArray(data.items)) {
          clearCart();
          data.items.forEach((item: any) => {
            addItem({
              id: item.foodItemId,
              name: item.name || 'Food Item',
              price: item.price || 199,
              quantity: item.quantity || 1,
              restaurantId: data.restaurantId || 'rest-1',
              restaurantName: data.restaurantName || 'Restaurant',
            } as any);
          });
          router.push('/checkout');
        }
      }
    } catch {
      /* fallback */
    }
  };

  const filteredOrders = orders.filter(
    (ord) =>
      (ord.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (ord.restaurantName || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track live orders, view history &amp; reorder
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or restaurant..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* PROMINENT ACTIVE ORDER CARD */}
        {activeOrder && (
          <div className="rounded-3xl border-2 border-orange-500 bg-gradient-to-r from-orange-50/80 to-amber-50/50 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/60 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-orange-600 px-3.5 py-1 text-xs font-black text-white shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  LIVE ACTIVE ORDER
                </span>
                <span className="text-xs font-black text-gray-900">#{activeOrder.orderNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                <Clock className="h-4 w-4 text-orange-600 animate-spin" />
                <span>Estimated Arrival: ~{activeOrder.etaMins} mins</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">{activeOrder.restaurantName}</h3>
                <p className="text-xs font-semibold text-gray-600">
                  {activeOrder.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-orange-600" /> {activeOrder.customerAddress}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={`/orders/${activeOrder.orderId}`}
                  className="flex-1 sm:flex-initial text-center rounded-2xl border border-orange-300 bg-white px-5 py-3 text-xs font-bold text-gray-800 hover:bg-orange-50 transition"
                >
                  View Details
                </Link>

                <Link
                  href={`/orders/${activeOrder.orderId}/track`}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 transition"
                >
                  <span>Track Live Map</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STATUS FILTER TABS */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'ACTIVE', label: 'Active Orders' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition min-h-[40px] ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ORDERS LIST */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-3xl bg-gray-100" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-xs font-bold text-gray-400 space-y-3">
              <FileText className="h-10 w-10 mx-auto text-gray-300" />
              <p>No orders found under &quot;{activeTab}&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 hover:border-orange-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900">{ord.restaurantName}</h3>
                        <p className="text-[10px] text-gray-400">
                          {ord.date} • <span className="font-bold text-gray-700">#{ord.orderNumber}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start sm:self-auto rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider ${
                        ord.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-600 font-medium">
                          <span className="font-bold text-gray-900">{ord.itemCount} Items:</span> {ord.itemsSummary}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {(ord.paymentMethod || 'Online').replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span className="text-base font-black text-gray-900">₹{ord.totalAmount.toFixed(2)}</span>
                    </div>

                  {ord.cancellationReason && (
                    <div className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                      <span className="text-[10px] uppercase block font-black text-rose-600">Cancelled:</span>
                      <span>{ord.cancellationReason}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                    >
                      <Eye className="h-4 w-4 text-orange-600" /> View Order Details
                    </Link>

                    <div className="flex items-center gap-2">
                      {ord.status === 'DELIVERED' && (
                        <Link
                          href={`/orders/${ord.id}`}
                          className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-xs"
                        >
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> Rate Restaurant
                        </Link>
                      )}

                      {ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED' && (
                        <Link
                          href={`/orders/${ord.id}/track`}
                          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 transition"
                        >
                          Track Order <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      {(ord.status === 'DELIVERED' || ord.status === 'CANCELLED') && (
                        <button
                          onClick={() => handleReorder(ord.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
