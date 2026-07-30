'use client';

import React, { useState, useEffect } from 'react';
import { KitchenOrderItem } from '../../data/hotel-mock-data';
import { useKitchenStore } from '../../stores/use-kitchen-store';
import { Search, ShoppingBag, Clock } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function HotelOrdersPage() {
  const { queue, setQueue } = useKitchenStore();
  const [filter, setFilter] = useState<'ALL' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders`);
        if (res.ok) {
          const data = await res.json();
          setQueue(Array.isArray(data) ? data : data.orders ?? []);
        }
      } catch {
        /* backend offline fallback */
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [setQueue]);

  let orders: KitchenOrderItem[] = [...queue];
  if (filter !== 'ALL') {
    orders = orders.filter((o) => o.status === filter);
  }
  if (search) {
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">All Restaurant Orders</h1>
          <p className="text-xs text-gray-500">Historical order records and real-time status management</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number or customer..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['ALL', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition shrink-0 min-h-[40px] ${
              filter === status
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Mobile View: Cards (< 768px) */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            Loading order records...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            No orders found matching filter criteria.
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-gray-900">{o.orderNumber}</span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-800">
                  {o.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{o.customerName}</p>
                <p className="text-[10px] text-gray-400">{o.customerPhone}</p>
              </div>
              <div className="border-t border-b border-gray-100 py-2 space-y-1 text-xs text-gray-700">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}x {i.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs font-black text-gray-900">
                <span>Total: ₹{o.totalAmount}</span>
                <span className="text-[10px] font-normal text-gray-500">{o.placedAt}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table (>= 768px) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Placed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders found</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-black text-gray-900">{o.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{o.customerName}</p>
                      <p className="text-[10px] text-gray-400">{o.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {o.items.map((i: { name: string; quantity: number }) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">₹{o.totalAmount}</td>
                    <td className="px-6 py-4 text-gray-500">{o.placedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
