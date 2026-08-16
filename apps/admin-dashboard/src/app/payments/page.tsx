'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, RefreshCw, CheckCircle, XCircle, AlertTriangle, ArrowUpRight, Search, ShieldCheck } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  commissionRate: number | null;
  commissionAmount: number;
  commissionStatus: 'CONFIGURED' | 'UNCONFIGURED';
  hasRefund: boolean;
  refundAmount: number;
  createdAt: string;
}

interface PaymentStats {
  totalGmv: number;
  platformCommission: number;
  netPayoutsDue: number;
  totalPayments: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalGmv: 0,
    platformCommission: 0,
    netPayoutsDue: 0,
    totalPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/payments/admin?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.restaurantName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.razorpayPaymentId || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Live Payment Ledger</h1>
          <p className="text-xs text-gray-500">Real-time payment transactions, gateway reconciliation &amp; commission snapshot ledger</p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Settled GMV</p>
          <h3 className="text-3xl font-black text-purple-600">₹{stats.totalGmv.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-purple-600 font-bold">Authoritative gross customer sales</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Actual Platform Commission</p>
          <h3 className="text-3xl font-black text-emerald-600">₹{stats.platformCommission.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-emerald-600 font-bold">Sum of immutable order commission snapshots</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Transactions</p>
          <h3 className="text-3xl font-black text-gray-900">{stats.totalPayments}</h3>
          <p className="text-[10px] text-gray-400 font-bold">Processed across all channels</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, restaurant, txn..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filterStatus === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction / Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Commission Snapshot</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">Loading payment ledger...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">No payment transactions found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">#{p.orderNumber}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">
                        {p.razorpayPaymentId || p.id}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {p.customerName}
                      <span className="block text-[10px] font-normal text-gray-400">{p.customerPhone}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{p.restaurantName}</td>
                    <td className="px-6 py-4 font-black text-gray-900">₹{p.amount}</td>
                    <td className="px-6 py-4">
                      {p.commissionStatus === 'CONFIGURED' ? (
                        <div>
                          <span className="font-black text-emerald-700">₹{p.commissionAmount}</span>{' '}
                          <span className="text-[10px] font-bold text-gray-500">({p.commissionRate}%)</span>
                          <span className="block text-[9px] font-black text-emerald-600 uppercase">CONFIGURED</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-black text-gray-400">₹0.00</span>
                          <span className="block text-[9px] font-black text-amber-600 uppercase">UNCONFIGURED</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : p.status === 'REFUNDED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}{' '}
                      {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
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
