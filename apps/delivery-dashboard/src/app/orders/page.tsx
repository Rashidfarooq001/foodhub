'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Store, MapPin, Calendar, Loader2, PackageCheck } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

interface TripHistoryItem {
  id: string;
  orderNumber: string;
  restaurantName: string;
  distanceKm?: number;
  riderPayout: number;
  deliveredAt: string;
  status: string;
}

export default function DeliveryOrdersPage() {
  const { accessToken } = useDeliveryAuthStore();
  const [history, setHistory] = useState<TripHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/delivery/history`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Failed to load delivery trip history', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [accessToken]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Delivery Trip History
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500">
          Completed delivery jobs, pickup/drop addresses &amp; earned compensation ledger
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading delivery history...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 p-12 text-center bg-white space-y-3">
          <PackageCheck className="h-10 w-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No completed deliveries yet</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Once you complete assigned customer delivery orders, your full trip receipts and payouts will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards (< 768px) */}
          <div className="block md:hidden space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 shadow-sm space-y-2.5"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-xs font-black text-emerald-800">{h.orderNumber}</span>
                  <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {h.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-700">
                  <p className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Store className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    <span>{h.restaurantName}</span>
                  </p>
                  {h.distanceKm !== undefined && (
                    <p className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{h.distanceKm} km trip</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-xs">
                  <span className="font-black text-emerald-700">Earnings: ₹{h.riderPayout}</span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {h.deliveredAt ? new Date(h.deliveredAt).toLocaleDateString() : 'Delivered'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table (>= 768px) */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Pickup Restaurant</th>
                    <th className="px-6 py-4">Distance</th>
                    <th className="px-6 py-4">Payout</th>
                    <th className="px-6 py-4">Delivered At</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-800">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-black text-emerald-800">{h.orderNumber}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{h.restaurantName}</td>
                      <td className="px-6 py-4 text-gray-500">{h.distanceKm ? `${h.distanceKm} km` : '—'}</td>
                      <td className="px-6 py-4 font-black text-emerald-700">₹{h.riderPayout}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {h.deliveredAt ? new Date(h.deliveredAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
