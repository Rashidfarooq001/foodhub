'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, DollarSign, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  ArrowUpRight, Search, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2,
  Store, Bike, Building2, Calendar, FileText, Send, Eye, ShieldAlert, ArrowRight,
  TrendingUp, AlertCircle, Clock, Check
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

// Types
interface RestaurantSettlementRow {
  restaurantId: string;
  restaurantName: string;
  phone: string;
  email: string | null;
  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    isConfigured: boolean;
  };
  orderCount: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  authorizedDeductions: number;
  netPayable: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'PAYOUT_FAILED';
  utrNumber: string | null;
  payoutId: string | null;
  settledAt: string | null;
  failureReason: string | null;
}

interface SettlementSummary {
  totalRestaurants: number;
  weeklyGmv: number;
  totalCommission: number;
  totalRestaurantPayable: number;
  totalAlreadyPaid: number;
  totalPendingPayable: number;
  processingCount: number;
  failedCount: number;
}

interface SettlementPeriodInfo {
  type: string;
  start: string;
  end: string;
  label: string;
}

interface OrderDetailItem {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  foodSubtotal: number;
  commissionRate: number;
  commissionAmount: number;
  restaurantNet: number;
}

interface RestaurantDetailData {
  period: { start: string; end: string; label: string };
  restaurant: { id: string; name: string; phone: string; email: string | null; commissionRate: number };
  bankAccount: { bankName: string; accountHolder: string; accountNumber: string; ifscCode: string; isConfigured: boolean };
  financialSummary: {
    orderCount: number;
    grossSales: number;
    commissionAmount: number;
    authorizedDeductions: number;
    netPayable: number;
    paidAmount: number;
    pendingAmount: number;
    status: string;
    utrNumber: string | null;
    payoutId: string | null;
    settledAt: string | null;
    failureReason: string | null;
  };
  orders: OrderDetailItem[];
}

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'settlements' | 'payments' | 'riders' | 'revenue' | 'reconciliation'>('settlements');
  
  // Weekly Settlements State
  const [periodType, setPeriodType] = useState<'current' | 'previous' | 'custom'>('current');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [settlementPeriod, setSettlementPeriod] = useState<SettlementPeriodInfo | null>(null);
  const [settlementSummary, setSettlementSummary] = useState<SettlementSummary | null>(null);
  const [restaurantSettlements, setRestaurantSettlements] = useState<RestaurantSettlementRow[]>([]);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(true);
  const [settlementSearch, setSettlementSearch] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('ALL');

  // Restaurant Detail Modal State
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurantDetail, setRestaurantDetail] = useState<RestaurantDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Payout Dialog Confirmation State
  const [payoutTarget, setPayoutTarget] = useState<RestaurantSettlementRow | null>(null);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{ success: boolean; message: string } | null>(null);

  // General Payments / Ledger State
  const [payments, setPayments] = useState<any[]>([]);
  const [ledgerStats, setLedgerStats] = useState<any>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Reconciliation State
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [isLoadingReconciliation, setIsLoadingReconciliation] = useState(false);

  // 1. Fetch Weekly Settlements
  const fetchWeeklySettlements = async () => {
    setIsLoadingSettlements(true);
    try {
      let query = `periodType=${periodType}`;
      if (periodType === 'custom' && customStart && customEnd) {
        query += `&customStart=${encodeURIComponent(customStart)}&customEnd=${encodeURIComponent(customEnd)}`;
      }
      const res = await adminFetch(`/settlements/weekly?${query}`);
      if (res.ok) {
        const data = await res.json();
        setSettlementPeriod(data.period);
        setSettlementSummary(data.summary);
        setRestaurantSettlements(data.restaurants || []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoadingSettlements(false);
    }
  };

  // 2. Fetch Restaurant Detail Modal
  const fetchRestaurantDetail = async (restId: string) => {
    setSelectedRestaurantId(restId);
    setIsLoadingDetail(true);
    setRestaurantDetail(null);
    try {
      let query = `periodType=${periodType}`;
      if (periodType === 'custom' && customStart && customEnd) {
        query += `&customStart=${encodeURIComponent(customStart)}&customEnd=${encodeURIComponent(customEnd)}`;
      }
      const res = await adminFetch(`/settlements/restaurant/${restId}/detail?${query}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurantDetail(data);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 3. Fetch Multi-Party Payments Ledger
  const fetchPaymentsLedger = async () => {
    setIsLoadingLedger(true);
    try {
      const res = await adminFetch('/payments/admin?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setLedgerStats(data.stats || null);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoadingLedger(false);
    }
  };

  // 4. Fetch Reconciliation Audit
  const fetchReconciliation = async () => {
    setIsLoadingReconciliation(true);
    try {
      let query = `periodType=${periodType}`;
      if (periodType === 'custom' && customStart && customEnd) {
        query += `&customStart=${encodeURIComponent(customStart)}&customEnd=${encodeURIComponent(customEnd)}`;
      }
      const res = await adminFetch(`/settlements/reconciliation?${query}`);
      if (res.ok) {
        const data = await res.json();
        setReconciliation(data);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoadingReconciliation(false);
    }
  };

  // Initial and reactive loads
  useEffect(() => {
    fetchWeeklySettlements();
  }, [periodType, customStart, customEnd]);

  useEffect(() => {
    if (activeTab === 'payments' || activeTab === 'riders' || activeTab === 'revenue') {
      fetchPaymentsLedger();
    } else if (activeTab === 'reconciliation') {
      fetchReconciliation();
    }
  }, [activeTab, periodType]);

  // Execute Real Bank / RazorpayX Payout
  const handleExecutePayout = async () => {
    if (!payoutTarget) return;
    setIsProcessingPayout(true);
    setPayoutResult(null);

    try {
      const res = await adminFetch(`/settlements/restaurant/${payoutTarget.restaurantId}/payout`, {
        method: 'POST',
        body: JSON.stringify({
          periodType,
          customStart: periodType === 'custom' ? customStart : undefined,
          customEnd: periodType === 'custom' ? customEnd : undefined,
          notes: `Admin manual payout settlement for ${settlementPeriod?.label}`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPayoutResult({ success: true, message: data.message || 'Settlement paid and marked SETTLED.' });
        fetchWeeklySettlements();
        if (selectedRestaurantId) fetchRestaurantDetail(selectedRestaurantId);
      } else {
        setPayoutResult({ success: false, message: data.message || 'Payout failed. Settlement remains in pending/failed status.' });
        fetchWeeklySettlements();
      }
    } catch (err: any) {
      setPayoutResult({ success: false, message: err.message || 'Network exception connecting to payout provider.' });
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Filtered Restaurant Settlement Rows
  const filteredRestaurants = restaurantSettlements.filter((r) => {
    const matchesSearch =
      r.restaurantName.toLowerCase().includes(settlementSearch.toLowerCase()) ||
      r.restaurantId.toLowerCase().includes(settlementSearch.toLowerCase()) ||
      (r.phone && r.phone.includes(settlementSearch));

    const matchesStatus =
      settlementStatusFilter === 'ALL' ||
      r.status === settlementStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Payments &amp; Settlements Center</h1>
          <p className="text-xs text-gray-500">
            Authoritative restaurant weekly settlements, real bank payouts, customer payments &amp; financial reconciliation
          </p>
        </div>

        <button
          onClick={() => {
            fetchWeeklySettlements();
            if (activeTab === 'payments') fetchPaymentsLedger();
            if (activeTab === 'reconciliation') fetchReconciliation();
          }}
          disabled={isLoadingSettlements}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSettlements ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Tab Bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
        {[
          { id: 'settlements', label: 'RESTAURANT SETTLEMENTS', icon: Store },
          { id: 'payments', label: 'CUSTOMER PAYMENTS', icon: CreditCard },
          { id: 'riders', label: 'RIDER PAYOUTS', icon: Bike },
          { id: 'revenue', label: 'FOODHUB REVENUE', icon: TrendingUp },
          { id: 'reconciliation', label: 'FINANCIAL RECONCILIATION', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESTAURANT SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          {/* Period Selector Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-orange-100 bg-orange-50/40 p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-950">Settlement Period</span>
              </div>
              <p className="text-base font-black text-gray-900">
                {settlementPeriod?.label || 'Calculating period...'}
              </p>
              <p className="text-[10px] text-gray-500">Asia/Kolkata (IST) Monday 00:00:00 → Sunday 23:59:59.999</p>
            </div>

            {/* Period Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-xs text-xs font-bold">
              <button
                onClick={() => setPeriodType('current')}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  periodType === 'current' ? 'bg-orange-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Current Week
              </button>
              <button
                onClick={() => setPeriodType('previous')}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  periodType === 'previous' ? 'bg-orange-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Previous Week
              </button>
              <button
                onClick={() => setPeriodType('custom')}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  periodType === 'custom' ? 'bg-orange-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {periodType === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-gray-200 p-2 text-xs font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-gray-200 p-2 text-xs font-bold text-gray-900"
                />
              </div>
              <button
                onClick={fetchWeeklySettlements}
                className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Total Restaurants</p>
              <h3 className="text-xl font-black text-gray-900">{settlementSummary?.totalRestaurants ?? 0}</h3>
              <p className="text-[10px] text-gray-400">All registered kitchens</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Weekly GMV</p>
              <h3 className="text-xl font-black text-gray-900">₹{(settlementSummary?.weeklyGmv ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-gray-400">Food sales in period</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Restaurant Commission</p>
              <h3 className="text-xl font-black text-blue-600">₹{(settlementSummary?.totalCommission ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-blue-600 font-bold">FoodHub commission cut</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Total Net Payable</p>
              <h3 className="text-xl font-black text-purple-600">₹{(settlementSummary?.totalRestaurantPayable ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-gray-400">Gross food sales - commission</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Already Paid</p>
              <h3 className="text-xl font-black text-emerald-600">₹{(settlementSummary?.totalAlreadyPaid ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-emerald-600 font-bold">Disbursed via bank payout</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase">Pending Payable</p>
              <h3 className="text-xl font-black text-orange-600">₹{(settlementSummary?.totalPendingPayable ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-orange-600 font-bold">Awaiting payout execution</p>
            </div>
          </div>

          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search restaurant by name, ID, phone..."
                value={settlementSearch}
                onChange={(e) => setSettlementSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-orange-600 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {['ALL', 'PENDING', 'PROCESSING', 'SETTLED', 'PAYOUT_FAILED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSettlementStatusFilter(st)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    settlementStatusFilter === st
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Restaurant Settlements Table */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-4 py-4 text-center">Orders</th>
                    <th className="px-4 py-4 text-right">Gross Sales</th>
                    <th className="px-4 py-4 text-right">Commission</th>
                    <th className="px-4 py-4 text-right">Net Payable</th>
                    <th className="px-4 py-4 text-right">Paid</th>
                    <th className="px-4 py-4 text-right">Pending</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {isLoadingSettlements ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold">
                        Loading restaurant settlement accounts from PostgreSQL...
                      </td>
                    </tr>
                  ) : filteredRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold">
                        No restaurant settlement records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRestaurants.map((r) => {
                      const isPending = r.status === 'PENDING' && r.pendingAmount > 0;
                      const isSettled = r.status === 'SETTLED';
                      const isProcessing = r.status === 'PROCESSING';
                      const isFailed = r.status === 'PAYOUT_FAILED';

                      return (
                        <tr key={r.restaurantId} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{r.restaurantName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {r.restaurantId.slice(0, 8)}... | {r.phone}</p>
                            <p className="text-[10px] text-gray-500">{r.bankDetails.bankName} ({r.bankDetails.accountNumber})</p>
                          </td>
                          <td className="px-4 py-4 text-center font-bold">{r.orderCount}</td>
                          <td className="px-4 py-4 text-right font-black text-gray-900">₹{r.grossSales.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-bold text-blue-600">₹{r.commissionAmount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400">({r.commissionRate}%)</p>
                          </td>
                          <td className="px-4 py-4 text-right font-black text-purple-700">₹{r.netPayable.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-4 text-right font-bold text-emerald-600">₹{r.paidAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-4 text-right font-black text-orange-600">₹{r.pendingAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
                                isSettled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isProcessing
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                                  : isFailed
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {r.status}
                            </span>
                            {r.utrNumber && <p className="text-[9px] text-gray-400 mt-0.5 font-mono">{r.utrNumber}</p>}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => fetchRestaurantDetail(r.restaurantId)}
                              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs"
                            >
                              Details
                            </button>
                            {r.pendingAmount > 0 && r.status !== 'SETTLED' && r.status !== 'PROCESSING' && (
                              <button
                                onClick={() => {
                                  setPayoutTarget(r);
                                  setPayoutResult(null);
                                }}
                                className="rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700"
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER PAYMENTS LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Order / Payment ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-4 py-4 text-right">Food Amount</th>
                    <th className="px-4 py-4 text-right">Delivery</th>
                    <th className="px-4 py-4 text-right">Platform</th>
                    <th className="px-4 py-4 text-right">GST</th>
                    <th className="px-6 py-4 text-right">Total Paid</th>
                    <th className="px-4 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {isLoadingLedger ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold">
                        Loading customer payment transactions...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold">
                        No customer payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{p.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{p.customer?.gatewayTransactionId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{p.customer?.name}</p>
                          <p className="text-[10px] text-gray-400">{p.customer?.phone}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{p.restaurant?.name}</td>
                        <td className="px-4 py-4 text-right font-black text-gray-900">₹{p.customer?.foodSubtotal}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-600">₹{p.customer?.deliveryFee}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-600">₹{p.customer?.platformFee}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-600">₹{p.customer?.gst}</td>
                        <td className="px-6 py-4 text-right font-black text-purple-700">₹{p.customer?.customerPaid}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
                            {p.customer?.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIDER PAYOUTS */}
      {activeTab === 'riders' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-black text-gray-900">Courier Partner Delivery Dispatches</h3>
              <p className="text-xs text-gray-500">Trip deliveries, distance allowances, and courier settlements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase">Rider Payout Liability</span>
              <h4 className="text-2xl font-black text-amber-700">₹{(ledgerStats?.riderGrossEarnings ?? 0).toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-amber-800">Total earned across completed trips</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <span className="text-xs font-bold text-gray-700 uppercase">Paid Disbursals</span>
              <h4 className="text-2xl font-black text-gray-900">₹{(ledgerStats?.riderSettledAmount ?? 0).toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-gray-500">Settled to rider bank/wallets</p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-1">
              <span className="text-xs font-bold text-orange-900 uppercase">Pending Courier Balance</span>
              <h4 className="text-2xl font-black text-orange-700">₹{(ledgerStats?.riderPendingSettlement ?? 0).toLocaleString('en-IN')}</h4>
              <p className="text-[10px] text-orange-800">Pending partner transfer</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FOODHUB REVENUE */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Platform Operating Inflow</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-bold text-gray-600">Restaurant Commission Collected</span>
                <span className="font-black text-gray-900">₹{(ledgerStats?.platformCommissionRevenue ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-bold text-gray-600">Platform Fees (₹3 per order)</span>
                <span className="font-black text-gray-900">₹{(ledgerStats?.platformFeeRevenue ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-bold text-gray-600">Customer Delivery Revenue</span>
                <span className="font-black text-gray-900">₹{(ledgerStats?.deliveryFeeRevenue ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-blue-700">
                <span>Total Gross Operating Inflow</span>
                <span>₹{((ledgerStats?.platformCommissionRevenue ?? 0) + (ledgerStats?.platformFeeRevenue ?? 0) + (ledgerStats?.deliveryFeeRevenue ?? 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Operating Costs &amp; Net Contribution</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-bold text-gray-600">Courier Partner Payout Costs</span>
                <span className="font-black text-rose-600">- ₹{(ledgerStats?.riderGrossEarnings ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="font-bold text-gray-600">Customer Refunds Processed</span>
                <span className="font-black text-rose-600">- ₹{(ledgerStats?.refundAmount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-emerald-700">
                <span>Net Platform Contribution</span>
                <span>₹{(ledgerStats?.platformNetContribution ?? 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">Double-Entry Financial Equation Verification</h3>
              <p className="text-xs text-gray-500">
                Verifies Customer Collections = Restaurant Payable + Commission + Platform Fee + Delivery Revenue + GST
              </p>
            </div>
            {reconciliation && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black ${
                  reconciliation.status === 'BALANCED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {reconciliation.status === 'BALANCED' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>{reconciliation.status === 'BALANCED' ? 'RECONCILIATION BALANCED' : `RECONCILIATION ERROR (Diff: ₹${reconciliation.discrepancyAmount})`}</span>
              </span>
            )}
          </div>

          {isLoadingReconciliation ? (
            <p className="py-12 text-center text-xs font-bold text-gray-400">Verifying double-entry mathematical ledger...</p>
          ) : reconciliation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gray-50 p-5 space-y-3 text-xs">
                <span className="font-bold text-gray-400 uppercase text-[10px]">Total Inflow Collected</span>
                <div className="flex justify-between text-base font-black text-gray-900">
                  <span>Customer Payments (Actual)</span>
                  <span>₹{reconciliation.equation?.customerCollections?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5 space-y-2 text-xs">
                <span className="font-bold text-gray-400 uppercase text-[10px]">Reconstructed Components</span>
                <div className="flex justify-between py-0.5">
                  <span>Restaurant Net Payable:</span>
                  <span className="font-bold">₹{reconciliation.equation?.restaurantPayable?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Restaurant Commission:</span>
                  <span className="font-bold">₹{reconciliation.equation?.restaurantCommission?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Platform Fees (₹3):</span>
                  <span className="font-bold">₹{reconciliation.equation?.platformFee?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Delivery Revenue:</span>
                  <span className="font-bold">₹{reconciliation.equation?.deliveryRevenue?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Statutory GST:</span>
                  <span className="font-bold">₹{reconciliation.equation?.statutoryGst?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-purple-700">
                  <span>Total Reconstructed:</span>
                  <span>₹{reconciliation.equation?.reconstructedTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* RESTAURANT DETAIL & EXPANDABLE ORDERS MODAL */}
      {selectedRestaurantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {restaurantDetail?.restaurant?.name || 'Restaurant Settlement Breakdown'}
                </h3>
                <p className="text-xs text-gray-500">
                  Period: {restaurantDetail?.period?.label || settlementPeriod?.label}
                </p>
              </div>
              <button
                onClick={() => setSelectedRestaurantId(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {isLoadingDetail ? (
              <p className="py-12 text-center text-xs font-bold text-gray-400">Loading order-level breakdown...</p>
            ) : restaurantDetail ? (
              <div className="space-y-6">
                {/* Bank Details & Period Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1.5 text-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400">Bank Destination</span>
                    <p className="font-bold text-gray-900">{restaurantDetail.bankAccount.bankName}</p>
                    <p className="text-gray-600">A/C: <span className="font-mono font-bold">{restaurantDetail.bankAccount.accountNumber}</span></p>
                    <p className="text-gray-600">IFSC: <span className="font-mono font-bold">{restaurantDetail.bankAccount.ifscCode}</span></p>
                    <p className="text-gray-600">Holder: {restaurantDetail.bankAccount.accountHolder}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1 text-xs">
                    <span className="text-[10px] font-black uppercase text-gray-400">Financial Summary</span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Food Sales ({restaurantDetail.financialSummary.orderCount} orders):</span>
                      <span className="font-bold text-gray-900">₹{restaurantDetail.financialSummary.grossSales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commission ({restaurantDetail.restaurant.commissionRate}%):</span>
                      <span className="font-bold text-blue-600">₹{restaurantDetail.financialSummary.commissionAmount}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Net Restaurant Payable:</span>
                      <span className="font-black text-purple-700">₹{restaurantDetail.financialSummary.netPayable}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid / Settled:</span>
                      <span className="font-bold text-emerald-600">₹{restaurantDetail.financialSummary.paidAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-orange-600">Pending Payable:</span>
                      <span className="font-black text-orange-600">₹{restaurantDetail.financialSummary.pendingAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Order-Level Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                    Order-by-Order Accounting ({restaurantDetail.orders.length})
                  </h4>
                  <div className="overflow-hidden rounded-2xl border border-gray-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Order #</th>
                          <th className="px-4 py-2.5">Customer</th>
                          <th className="px-4 py-2.5 text-right">Food Subtotal</th>
                          <th className="px-4 py-2.5 text-right">Commission</th>
                          <th className="px-4 py-2.5 text-right">Restaurant Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {restaurantDetail.orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400 font-bold">
                              No delivered orders for this restaurant in this period.
                            </td>
                          </tr>
                        ) : (
                          restaurantDetail.orders.map((ord) => (
                            <tr key={ord.orderId}>
                              <td className="px-4 py-2.5 font-bold text-gray-900">{ord.orderNumber}</td>
                              <td className="px-4 py-2.5 text-gray-600">{ord.customerName}</td>
                              <td className="px-4 py-2.5 text-right font-black text-gray-900">₹{ord.foodSubtotal}</td>
                              <td className="px-4 py-2.5 text-right text-blue-600">₹{ord.commissionAmount}</td>
                              <td className="px-4 py-2.5 text-right font-black text-purple-700">₹{ord.restaurantNet}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CONFIRM PAYOUT DIALOG */}
      {payoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">Confirm Bank Payout</h3>
                <p className="text-xs text-gray-500">Initiate bank transfer to restaurant bank account</p>
              </div>
              <button
                onClick={() => {
                  setPayoutTarget(null);
                  setPayoutResult(null);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {payoutResult && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold border ${
                  payoutResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {payoutResult.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
                  <span>{payoutResult.message}</span>
                </div>
              </div>
            )}

            {!payoutResult?.success && (
              <>
                <div className="rounded-2xl bg-gray-50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Restaurant:</span>
                    <span className="font-bold text-gray-900">{payoutTarget.restaurantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Settlement Period:</span>
                    <span className="font-bold text-gray-900">{settlementPeriod?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gross Food Sales ({payoutTarget.orderCount} orders):</span>
                    <span className="font-bold text-gray-900">₹{payoutTarget.grossSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Commission:</span>
                    <span className="font-bold text-blue-600">₹{payoutTarget.commissionAmount}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-black text-gray-900">
                    <span>Payable Amount:</span>
                    <span className="text-orange-600">₹{payoutTarget.pendingAmount}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 text-[10px] text-gray-500 space-y-0.5">
                    <p>Destination: {payoutTarget.bankDetails.bankName}</p>
                    <p>A/C: {payoutTarget.bankDetails.accountNumber} ({payoutTarget.bankDetails.ifscCode})</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutTarget(null);
                      setPayoutResult(null);
                    }}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePayout}
                    disabled={isProcessingPayout}
                    className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isProcessingPayout ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing Bank Payout...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Execute Real Payout</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {payoutResult?.success && (
              <button
                type="button"
                onClick={() => {
                  setPayoutTarget(null);
                  setPayoutResult(null);
                }}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
