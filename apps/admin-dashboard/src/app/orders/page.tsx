'use client';

import React, { useState, useEffect } from 'react';
import { ADMIN_ORDER_FILTERS } from '@foodhub/types';
import { Search, ShoppingBag, RefreshCw, Eye, Store, User, MapPin } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/orders?page=1&limit=200');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders ?? []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
      case 'DRIVER_ASSIGNED':
      case 'ARRIVED_AT_RESTAURANT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING':
      case 'ACCEPTED':
      case 'READY_FOR_PICKUP':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
      case 'REFUNDED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filtered = orders.filter((o) => {
    let matchesStatus = false;

    if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else {
      const filterValue = ADMIN_ORDER_FILTERS[statusFilter as keyof typeof ADMIN_ORDER_FILTERS];
      if (Array.isArray(filterValue)) {
        matchesStatus = (filterValue as readonly string[]).includes(o.status);
      } else {
        matchesStatus = filterValue === o.status;
      }
    }

    const ordNum = o.orderNumber || o.id || '';
    const cust = o.customer?.profile?.firstName || o.customerName || '';
    const rest = o.restaurant?.name || '';
    const matchesSearch =
      !search ||
      ordNum.toLowerCase().includes(search.toLowerCase()) ||
      cust.toLowerCase().includes(search.toLowerCase()) ||
      rest.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Global Orders Log
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Platform-wide order search, lifecycle inspection &amp; customer fulfillment audit
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order #, restaurant name, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'DRIVER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[40px] ${
                statusFilter === st
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Stream (Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Global Orders ({filtered.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading platform orders...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No orders found matching filters.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {filtered.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-sm font-black text-gray-900">
                      #{o.orderNumber || o.id.slice(0, 8)}
                    </span>
                    <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${getStatusBadge(o.status)}`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                      <span className="font-bold text-gray-900">{o.restaurant?.name || 'Restaurant Kitchen'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span>{o.customer?.profile?.firstName || o.customerName || 'Customer'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-400 font-medium">
                      {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : 'Today'}
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      ₹{o.totalAmount || o.payableAmount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Restaurant</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">#{o.orderNumber || o.id.slice(0, 8)}</td>
                      <td className="py-3 text-gray-700">{o.customer?.profile?.firstName || o.customerName || 'Customer'}</td>
                      <td className="py-3 text-gray-900 font-bold">{o.restaurant?.name || 'Restaurant'}</td>
                      <td className="py-3 font-black text-gray-900">₹{o.totalAmount || o.payableAmount || 0}</td>
                      <td className="py-3">
                        <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-right">
                        {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : 'Today'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
