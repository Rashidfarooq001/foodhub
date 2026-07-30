'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ActiveOrderTrackingData } from '../../data/mock-data';
import { Clock, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface PastOrder {
  id: string;
  orderNumber: string;
  restaurantName: string;
  date: string;
  totalAmount: number;
  status: string;
  items: string;
}

export default function OrderHistoryPage() {
  const [activeOrder, setActiveOrder] = useState<ActiveOrderTrackingData | null>(null);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [activeRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/orders/active`),
          fetch(`${API_BASE}/orders/history`),
        ]);
        if (activeRes.ok) {
          setActiveOrder(await activeRes.json());
        }
        if (historyRes.ok) {
          const data = await historyRes.json();
          setPastOrders(Array.isArray(data) ? data : data.orders ?? []);
        }
      } catch { /* offline */ } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Your Order History</h1>
        <p className="text-xs text-gray-500">Track current orders &amp; reorder your favorite meals</p>
      </div>

      {/* Active Order Card */}
      {activeOrder && (
        <div className="rounded-3xl border-2 border-orange-500 bg-orange-50/30 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white">
                ACTIVE ORDER
              </span>
              <span className="text-xs font-bold text-gray-900">{activeOrder.orderNumber}</span>
            </div>
            <span className="text-xs font-bold text-orange-600">Arriving in ~{activeOrder.etaMins} mins</span>
          </div>

          <div className="flex justify-between items-center border-t border-orange-200/60 pt-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">{activeOrder.restaurantName}</h3>
              <p className="text-xs text-gray-600">
                {activeOrder.items?.map((i: { name: string; quantity: number }) => `${i.quantity}x ${i.name}`).join(', ')}
              </p>
            </div>
            <Link
              href={`/orders/${activeOrder.orderId}/track`}
              className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-orange-700"
            >
              Track Live Map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Past Orders List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Past Orders</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-gray-100" />
            ))}
          </div>
        ) : pastOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            No past orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {pastOrders.map((ord) => (
              <div key={ord.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{ord.restaurantName}</h3>
                    <p className="text-[10px] text-gray-400">{ord.date} • #{ord.orderNumber}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {ord.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600">{ord.items}</p>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black text-gray-900">₹{ord.totalAmount}</span>
                  <button className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100">
                    <RotateCcw className="h-3.5 w-3.5" /> Reorder
                  </button>
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
