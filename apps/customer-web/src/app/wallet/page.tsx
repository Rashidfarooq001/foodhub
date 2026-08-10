'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, FileText, ArrowRight } from 'lucide-react';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface PaymentRecord {
  id: string;
  orderNumber: string;
  restaurantName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  date: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-rose-100 text-rose-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'text-emerald-600',
  CANCELLED: 'text-rose-600',
  PENDING: 'text-amber-600',
};

export default function PaymentHistoryPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { accessToken } = useAuthStore.getState();
        const headers: Record<string, string> = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
        const res = await fetch(`${API_BASE}/orders/history`, { headers });
        if (res.ok) {
          const data = await res.json();
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch {
        // offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500 mt-1">Your past orders and payment records</p>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-600">No payment history yet</p>
              <p className="text-xs text-gray-400 mt-1">Place your first order to see it here.</p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
              >
                Browse Restaurants <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: order info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{rec.restaurantName}</p>
                    <p className="text-xs text-gray-400">
                      #{rec.orderNumber} · {rec.date || new Date(rec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{(rec.paymentMethod || 'Online').replace(/_/g, ' ')}</p>
                  </div>
                </div>

                {/* Right: amount + status */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <span className="text-base font-black text-gray-900">₹{rec.totalAmount?.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        STATUS_COLORS[rec.paymentStatus] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rec.paymentStatus || 'PAID'}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        ORDER_STATUS_COLORS[rec.status] || 'text-gray-600'
                      }`}
                    >
                      {(rec.status || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
