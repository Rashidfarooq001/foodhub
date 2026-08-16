'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  ArrowUpRight, Search, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Store, Bike, Building2
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    foodSubtotal: number;
    deliveryFee: number;
    platformFee: number;
    gst: number;
    customerPaid: number;
    paymentMethod: string;
    gatewayTransactionId: string;
    status: string;
  };
  restaurant: {
    id: string;
    name: string;
    grossFoodSales: number;
    commissionRate: number | null;
    commissionStatus: string;
    commissionAmount: number;
    restaurantNetPayable: number;
    settlementStatus: string;
    utrNumber: string;
  };
  platform: {
    commissionEarned: number;
    platformFeeCollected: number;
    deliveryFeeCollected: number;
    platformOperatingInflow: number;
  };
  rider: {
    distanceKm: number;
    baseEarning: number;
    distanceEarning: number;
    totalRiderEarning: number;
    settlementStatus: string;
  };
  statutory: {
    gstLiability: number;
  };
  reconciliation: {
    status: 'BALANCED' | 'MISMATCH';
    discrepancy: number;
  };
  hasRefund: boolean;
  refundAmount: number;
  createdAt: string;
}

interface PaymentStats {
  totalCustomerCollections: number;
  completedCustomerPayments: number;
  totalGmv: number;
  restaurantGrossPayable: number;
  restaurantCommission: number;
  restaurantNetPayable: number;
  restaurantSettledAmount: number;
  restaurantPendingSettlement: number;
  riderGrossEarnings: number;
  riderPendingSettlement: number;
  riderSettledAmount: number;
  platformCommissionRevenue: number;
  platformFeeRevenue: number;
  deliveryFeeRevenue: number;
  totalPlatformOperatingRevenue: number;
  platformNetContribution: number;
  refundAmount: number;
  totalPayments: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalCustomerCollections: 0,
    completedCustomerPayments: 0,
    totalGmv: 0,
    restaurantGrossPayable: 0,
    restaurantCommission: 0,
    restaurantNetPayable: 0,
    restaurantSettledAmount: 0,
    restaurantPendingSettlement: 0,
    riderGrossEarnings: 0,
    riderPendingSettlement: 0,
    riderSettledAmount: 0,
    platformCommissionRevenue: 0,
    platformFeeRevenue: 0,
    deliveryFeeRevenue: 0,
    totalPlatformOperatingRevenue: 0,
    platformNetContribution: 0,
    refundAmount: 0,
    totalPayments: 0,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      (p.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.restaurant?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.customer?.gatewayTransactionId || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || p.customer?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Multi-Party Financial Ledger</h1>
          <p className="text-xs text-gray-500">Authoritative payment ledger with multi-party settlement breakdowns &amp; double-entry reconciliation</p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Customer Collections</p>
          <h3 className="text-2xl font-black text-purple-600">₹{stats.totalCustomerCollections.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-gray-400">{stats.completedCustomerPayments} completed payments</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Restaurant Net Payable</p>
          <h3 className="text-2xl font-black text-emerald-600">₹{stats.restaurantNetPayable.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-emerald-600 font-bold">₹{stats.restaurantPendingSettlement.toLocaleString('en-IN')} pending bank payout</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Platform Gross Revenue</p>
          <h3 className="text-2xl font-black text-blue-600">₹{stats.totalPlatformOperatingRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-blue-600 font-bold">Commission + Platform Fee (₹3)</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase">Rider Payout Liability</p>
          <h3 className="text-2xl font-black text-amber-600">₹{stats.riderGrossEarnings.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-amber-600 font-bold">Direct distance-based delivery cost</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Restaurant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-purple-600 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['ALL', 'COMPLETED', 'PENDING', 'FAILED'].map((st) => (
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

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order / Payment ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Customer Paid</th>
                <th className="px-6 py-4">Restaurant Net</th>
                <th className="px-6 py-4">Platform Inflow</th>
                <th className="px-6 py-4">Reconciliation</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold">
                    Loading authoritative payment ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No payment records found in database.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isExpanded = expandedId === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-gray-900">{p.orderNumber}</p>
                          <p className="text-[10px] font-mono text-gray-400">{p.customer?.gatewayTransactionId}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{p.customer?.name}</p>
                          <p className="text-[10px] text-gray-400">{p.customer?.phone}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{p.restaurant?.name}</p>
                          <span className="text-[10px] text-gray-400">
                            Comm: {p.restaurant?.commissionRate !== null ? `${p.restaurant.commissionRate}%` : '0% (Unconfigured)'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-black text-gray-900 text-sm">
                            ₹{p.customer?.customerPaid.toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-purple-600 font-bold">{p.customer?.paymentMethod}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-black text-emerald-600 text-sm">
                            ₹{p.restaurant?.restaurantNetPayable.toLocaleString('en-IN')}
                          </span>
                          <span className={`block text-[10px] font-bold ${p.restaurant?.settlementStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {p.restaurant?.settlementStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-black text-blue-600 text-sm">
                            ₹{p.platform?.platformOperatingInflow.toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-medium">Comm + ₹3 Fee</span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                              p.reconciliation?.status === 'BALANCED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {p.reconciliation?.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Multi-Party Drawer */}
                      {isExpanded && (
                        <tr className="bg-purple-50/20 border-b border-purple-100">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-xs">
                              {/* Customer Breakdown */}
                              <div className="space-y-1.5 border-r border-gray-100 pr-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                                  <CreditCard className="h-3.5 w-3.5" /> Customer Inflow
                                </span>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Food Subtotal:</span>
                                  <span className="font-bold">₹{p.customer?.foodSubtotal}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Delivery Fee:</span>
                                  <span className="font-bold">₹{p.customer?.deliveryFee}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Platform Fee:</span>
                                  <span className="font-bold">₹{p.customer?.platformFee}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Statutory GST:</span>
                                  <span className="font-bold">₹{p.customer?.gst}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 font-black text-gray-900">
                                  <span>Total Collected:</span>
                                  <span>₹{p.customer?.customerPaid}</span>
                                </div>
                              </div>

                              {/* Restaurant Breakdown */}
                              <div className="space-y-1.5 border-r border-gray-100 pr-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                  <Store className="h-3.5 w-3.5" /> Restaurant Settlement
                                </span>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Gross Food Sales:</span>
                                  <span className="font-bold">₹{p.restaurant?.grossFoodSales}</span>
                                </div>
                                <div className="flex justify-between text-rose-600">
                                  <span>Commission ({p.restaurant?.commissionRate ?? 0}%):</span>
                                  <span className="font-bold">-₹{p.restaurant?.commissionAmount}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 font-black text-emerald-700">
                                  <span>Net Payable:</span>
                                  <span>₹{p.restaurant?.restaurantNetPayable}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 pt-1">
                                  Payout: {p.restaurant?.settlementStatus} {p.restaurant?.utrNumber !== '—' ? `(UTR: ${p.restaurant.utrNumber})` : ''}
                                </div>
                              </div>

                              {/* Platform & Rider Inflow */}
                              <div className="space-y-1.5 border-r border-gray-100 pr-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5" /> Platform Margin
                                </span>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Commission Cut:</span>
                                  <span className="font-bold">₹{p.platform?.commissionEarned}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Platform Fee:</span>
                                  <span className="font-bold">₹{p.platform?.platformFeeCollected}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Delivery Inflow:</span>
                                  <span className="font-bold">₹{p.platform?.deliveryFeeCollected}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 font-black text-blue-700">
                                  <span>Total Operating Cut:</span>
                                  <span>₹{p.platform?.platformOperatingInflow}</span>
                                </div>
                              </div>

                              {/* Rider & Audit */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                                  <Bike className="h-3.5 w-3.5" /> Rider Delivery Earning
                                </span>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Trip Distance:</span>
                                  <span className="font-bold">{p.rider?.distanceKm} km</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Base + Distance:</span>
                                  <span className="font-bold">₹{p.rider?.baseEarning} + ₹{p.rider?.distanceEarning}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 font-black text-amber-700">
                                  <span>Total Rider Pay:</span>
                                  <span>₹{p.rider?.totalRiderEarning}</span>
                                </div>
                                <div className="pt-1">
                                  <span className="text-[10px] font-mono text-gray-400">Ledger ID: {p.id.slice(0, 12)}...</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
