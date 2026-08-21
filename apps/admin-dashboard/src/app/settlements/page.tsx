'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Banknote,
  TrendingUp,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Store,
  ArrowRight,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  CreditCard,
  Building2,
  FileText,
  ShieldCheck,
  Percent,
  Receipt,
  Download,
  AlertTriangle,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

export type PeriodType = 'today' | 'this_week' | 'previous_week' | 'this_month' | 'previous_month' | 'custom';

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  isConfigured: boolean;
}

export interface RestaurantSettlementRow {
  restaurantId: string;
  restaurantName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  settlementId?: string | null;
  bankDetails: BankDetails;
  orderCount: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  gstAmount?: number;
  platformFees?: number;
  authorizedDeductions: number;
  netPayable: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'PAYOUT_FAILED' | string;
  utrNumber?: string | null;
  payoutId?: string | null;
  settledAt?: string | null;
  failureReason?: string | null;
}

export interface SettlementsOverviewResponse {
  period: {
    type: string;
    start: string;
    end: string;
    label: string;
  };
  summary: {
    totalRestaurants: number;
    weeklyGmv: number;
    totalCommission: number;
    totalGst?: number;
    totalPlatformFees?: number;
    totalRestaurantPayable: number;
    totalAlreadyPaid: number;
    totalPendingPayable: number;
    processingCount: number;
    failedCount: number;
  };
  restaurants: RestaurantSettlementRow[];
}

export interface OrderBreakdownRow {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  foodSubtotal: number;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  gstAmount: number;
  platformFee: number;
  restaurantNet: number;
  paymentStatus: string;
  orderStatus: string;
  settlementStatus: string;
}

export interface RestaurantSettlementDetail {
  period: {
    type?: string;
    start: string;
    end: string;
    label: string;
  };
  restaurant: {
    id: string;
    name: string;
    ownerName?: string;
    phone?: string;
    email?: string;
    commissionRate: number;
  };
  bankAccount: BankDetails;
  financialSummary: {
    orderCount: number;
    grossSales: number;
    commissionRate: number;
    commissionAmount: number;
    gstAmount: number;
    platformFees: number;
    authorizedDeductions: number;
    netPayable: number;
    paidAmount: number;
    pendingAmount: number;
    status: string;
    utrNumber?: string | null;
    payoutId?: string | null;
    settledAt?: string | null;
    failureReason?: string | null;
  };
  orders: OrderBreakdownRow[];
}

export interface SettlementHistoryItem {
  id: string;
  restaurantId: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  grossAmount: number;
  commissionRate?: number;
  commissionAmount: number;
  deductions?: number;
  netPayable: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  payoutId?: string | null;
  utrNumber?: string | null;
  failureReason?: string | null;
  settledAt?: string | null;
  createdAt: string;
}

export default function AdminSettlementsPage() {
  const [activeTab, setActiveTab] = useState<'RESTAURANTS' | 'RECONCILIATION'>('RESTAURANTS');

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('this_week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [data, setData] = useState<SettlementsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurantDetail, setRestaurantDetail] = useState<RestaurantSettlementDetail | null>(null);
  const [restaurantHistory, setRestaurantHistory] = useState<SettlementHistoryItem[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<PeriodType>('this_week');
  const [detailCustomStart, setDetailCustomStart] = useState('');
  const [detailCustomEnd, setDetailCustomEnd] = useState('');

  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);

  const [reconciliationData, setReconciliationData] = useState<any | null>(null);
  const [isReconLoading, setIsReconLoading] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let queryUrl = `/settlements/weekly?periodType=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        queryUrl += `&customStart=${encodeURIComponent(customStartDate)}&customEnd=${encodeURIComponent(customEndDate)}`;
      }

      const res = await adminFetch(queryUrl);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Failed to load settlement ledger.');
      }
    } catch {
      setErrorMsg('Network error connecting to settlement server.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const fetchRestaurantDetails = useCallback(
    async (restaurantId: string, pType: PeriodType = detailPeriod, cStart?: string, cEnd?: string) => {
      setIsDetailLoading(true);
      setPayoutError(null);
      setPayoutSuccess(null);
      try {
        let detailUrl = `/settlements/restaurant/${restaurantId}/detail?periodType=${pType}`;
        if (pType === 'custom' && (cStart || detailCustomStart) && (cEnd || detailCustomEnd)) {
          detailUrl += `&customStart=${encodeURIComponent(cStart || detailCustomStart)}&customEnd=${encodeURIComponent(cEnd || detailCustomEnd)}`;
        }

        const [detailRes, historyRes] = await Promise.all([
          adminFetch(detailUrl),
          adminFetch(`/settlements/restaurant/${restaurantId}/history`),
        ]);

        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          setRestaurantDetail(detailJson);
        }

        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          setRestaurantHistory(Array.isArray(historyJson) ? historyJson : []);
        }
      } catch {
        /* ignore */
      } finally {
        setIsDetailLoading(false);
      }
    },
    [detailPeriod, detailCustomStart, detailCustomEnd],
  );

  const handleOpenRestaurantModal = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setDetailPeriod(selectedPeriod);
    setDetailCustomStart(customStartDate);
    setDetailCustomEnd(customEndDate);
    fetchRestaurantDetails(restaurantId, selectedPeriod, customStartDate, customEndDate);
  };

  const handleCloseModal = () => {
    setSelectedRestaurantId(null);
    setRestaurantDetail(null);
    setRestaurantHistory([]);
    setPayoutError(null);
    setPayoutSuccess(null);
  };

  const handleProcessPayout = async () => {
    if (!selectedRestaurantId || !restaurantDetail) return;
    if (restaurantDetail.financialSummary.netPayable <= 0) {
      setPayoutError('Cannot process payout for ₹0.00 net payable.');
      return;
    }

    setIsProcessingPayout(true);
    setPayoutError(null);
    setPayoutSuccess(null);

    try {
      const res = await adminFetch(`/settlements/restaurant/${selectedRestaurantId}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodType: detailPeriod,
          customStart: detailCustomStart || undefined,
          customEnd: detailCustomEnd || undefined,
          notes: payoutNotes || 'Processed via Admin Settlement Portal',
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        setPayoutSuccess(resData.message || 'Payout successfully initiated.');
        setPayoutNotes('');
        fetchRestaurantDetails(selectedRestaurantId, detailPeriod, detailCustomStart, detailCustomEnd);
        fetchSettlements();
      } else {
        setPayoutError(resData.message || 'Payout processing could not be completed.');
      }
    } catch (err: any) {
      setPayoutError(err.message || 'Network exception while connecting to payout gateway.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const fetchReconciliation = async () => {
    setIsReconLoading(true);
    try {
      const res = await adminFetch(`/settlements/reconciliation?periodType=${selectedPeriod}`);
      if (res.ok) {
        setReconciliationData(await res.json());
      }
    } catch {
      /* offline */
    } finally {
      setIsReconLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'RECONCILIATION') {
      fetchReconciliation();
    }
  }, [activeTab, selectedPeriod]);

  const filteredRestaurants = useMemo(() => {
    const list = data?.restaurants || [];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((r) => {
      const matchName = r.restaurantName.toLowerCase().includes(q);
      const matchId = r.restaurantId.toLowerCase().includes(q);
      const matchOwner = (r.ownerName || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchSettlement = (r.settlementId || '').toLowerCase().includes(q);
      const matchBank = (r.bankDetails?.bankName || '').toLowerCase().includes(q);
      return (
        matchName ||
        matchId ||
        matchOwner ||
        matchPhone ||
        matchEmail ||
        matchSettlement ||
        matchBank
      );
    });
  }, [data?.restaurants, searchQuery]);

  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage) || 1;
  const paginatedRestaurants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRestaurants.slice(start, start + itemsPerPage);
  }, [filteredRestaurants, currentPage]);

  const summary = data?.summary || {
    totalRestaurants: 0,
    weeklyGmv: 0,
    totalCommission: 0,
    totalGst: 0,
    totalPlatformFees: 0,
    totalRestaurantPayable: 0,
    totalAlreadyPaid: 0,
    totalPendingPayable: 0,
    processingCount: 0,
    failedCount: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Payments &amp; Settlements
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative merchant settlement ledger, tax &amp; fee reconciliation, and disbursement control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettlements}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-purple-300 transition"
          >
            <RefreshCw className={`h-4 w-4 text-purple-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2 lg:border-b-0 lg:pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('RESTAURANTS')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold whitespace-nowrap transition shadow-sm ${
              activeTab === 'RESTAURANTS'
                ? 'bg-purple-600 text-white shadow-purple-600/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Restaurant Settlements ({data?.restaurants?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('RECONCILIATION')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold whitespace-nowrap transition shadow-sm ${
              activeTab === 'RECONCILIATION'
                ? 'bg-purple-600 text-white shadow-purple-600/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Reconciliation Audit</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { label: 'Today', key: 'today' },
              { label: 'This Week', key: 'this_week' },
              { label: 'Previous Week', key: 'previous_week' },
              { label: 'This Month', key: 'this_month' },
              { label: 'Previous Month', key: 'previous_month' },
              { label: 'Custom Range', key: 'custom' },
            ] as { label: string; key: PeriodType }[]
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSelectedPeriod(item.key);
                setCurrentPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedPeriod === item.key
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {selectedPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
          <Calendar className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-bold text-purple-900">Custom Date Range:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800"
          />
          <span className="text-xs text-gray-400 font-bold">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800"
          />
          <button
            onClick={fetchSettlements}
            className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-xs"
          >
            Apply Range
          </button>
        </div>
      )}

      {data?.period?.label && (
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Clock className="h-3.5 w-3.5 text-purple-600" />
          <span>Authoritative Period: <strong className="text-gray-800">{data.period.label}</strong></span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Sales (GMV)</span>
            <Banknote className="h-4 w-4 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900">
            ₹{summary.weeklyGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold">Total customer checkout value</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Platform Commission</span>
            <Percent className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-purple-600">
            ₹{summary.totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-purple-600/80 font-semibold">Total platform fee retained</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Net Merchant Payable</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600">
            ₹{summary.totalRestaurantPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-emerald-600/80 font-semibold">Gross sales minus commission</p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Disbursement</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-amber-600">
            ₹{summary.totalPendingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-amber-600/80 font-semibold">
            Already paid: ₹{summary.totalAlreadyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'RESTAURANTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Restaurant Partner Settlements ({filteredRestaurants.length})
              </h2>
              <p className="text-xs text-gray-500">
                Click any restaurant row to view order breakdown, payout details &amp; history.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search restaurant, ID, owner, phone, bank..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:outline-none shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Restaurant</th>
                    <th className="px-4 py-3.5 text-center">Orders</th>
                    <th className="px-4 py-3.5 text-right">Gross Sales</th>
                    <th className="px-4 py-3.5 text-right">Commission</th>
                    <th className="px-4 py-3.5 text-right">GST</th>
                    <th className="px-4 py-3.5 text-right">Platform Fees</th>
                    <th className="px-4 py-3.5 text-right">Restaurant Earnings</th>
                    <th className="px-4 py-3.5 text-right">Pending</th>
                    <th className="px-4 py-3.5 text-right">Paid</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center text-gray-400 space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-600" />
                        <p className="font-semibold text-xs">Loading authoritative settlement ledger...</p>
                      </td>
                    </tr>
                  ) : paginatedRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center text-gray-400 space-y-2">
                        <Store className="h-8 w-8 mx-auto text-gray-300" />
                        <p className="font-bold text-gray-700 text-sm">
                          No restaurant settlement records found for this period.
                        </p>
                        <p className="text-xs text-gray-400">
                          Try adjusting your search query or selecting another date range.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRestaurants.map((r) => (
                      <tr
                        key={r.restaurantId}
                        onClick={() => handleOpenRestaurantModal(r.restaurantId)}
                        className="hover:bg-purple-50/40 cursor-pointer transition group"
                      >
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 group-hover:text-purple-700 transition flex items-center gap-1.5">
                              <span>{r.restaurantName}</span>
                              <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-purple-600 transition" />
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              Owner: <span className="text-gray-600">{r.ownerName || 'Merchant'}</span> • {r.bankDetails?.bankName} ({r.bankDetails?.accountNumber})
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-gray-700">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px]">
                            {r.orderCount}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-gray-900">
                          ₹{r.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-rose-600">
                            -₹{r.commissionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-semibold">
                            ({r.commissionRate}%)
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right font-medium text-gray-600">
                          ₹{(r.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-4 text-right font-medium text-gray-600">
                          ₹{(r.platformFees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-4 text-right font-black text-emerald-600 text-sm">
                          ₹{r.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-amber-600">
                          ₹{r.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-4 text-right font-bold text-gray-700">
                          ₹{r.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                              r.status === 'SETTLED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800'
                                : r.status === 'PAYOUT_FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRestaurantModal(r.restaurantId);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50 text-xs">
                <span className="text-gray-500 font-semibold">
                  Showing page <strong className="text-gray-900">{currentPage}</strong> of <strong className="text-gray-900">{totalPages}</strong> ({filteredRestaurants.length} restaurants)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'RECONCILIATION' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900">Double-Entry Financial Reconciliation</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Mathematical proof: Total Order Payments = Merchant Net Payouts + Platform Net Retained + Rider Payouts + Statutory Taxes.
              </p>
            </div>

            {isReconLoading ? (
              <div className="py-12 text-center text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-600" />
                <p className="text-xs font-semibold mt-2">Computing double-entry audit...</p>
              </div>
            ) : reconciliationData ? (
              <div className="space-y-6">
                <div
                  className={`rounded-2xl p-5 border flex items-center gap-4 ${
                    reconciliationData.isMathematicallyReconciled
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <ShieldCheck className="h-7 w-7 shrink-0 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider">
                      {reconciliationData.isMathematicallyReconciled
                        ? '100% Balanced & Reconciled'
                        : 'Discrepancy Detected'}
                    </h4>
                    <p className="text-xs">
                      {reconciliationData.message ||
                        'Total inbound payments strictly match sum of merchant settlements and platform fees.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Total Inflow (Paid Orders)</p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      ₹{Number(reconciliationData.totalInboundCustomerPayments || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Merchant Outflow (Net)</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">
                      ₹{Number(reconciliationData.totalMerchantNetPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Platform Retained Revenue</p>
                    <p className="text-xl font-black text-purple-600 mt-1">
                      ₹{Number(reconciliationData.totalPlatformNetRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No reconciliation records available.</p>
            )}
          </div>
        </div>
      )}

      {selectedRestaurantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                    {restaurantDetail?.restaurant?.name || 'Restaurant Settlement Details'}
                  </h2>
                  {restaurantDetail?.financialSummary?.status && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        restaurantDetail.financialSummary.status === 'SETTLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : restaurantDetail.financialSummary.status === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-800'
                          : restaurantDetail.financialSummary.status === 'PAYOUT_FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {restaurantDetail.financialSummary.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{selectedRestaurantId}</code> • Owner: <strong className="text-gray-800">{restaurantDetail?.restaurant?.ownerName || 'Merchant'}</strong> • {restaurantDetail?.restaurant?.phone || 'No phone'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span>Period:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { label: 'Today', key: 'today' },
                    { label: 'This Week', key: 'this_week' },
                    { label: 'Previous Week', key: 'previous_week' },
                    { label: 'This Month', key: 'this_month' },
                    { label: 'Previous Month', key: 'previous_month' },
                    { label: 'Custom', key: 'custom' },
                  ] as { label: string; key: PeriodType }[]
                ).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setDetailPeriod(p.key);
                      fetchRestaurantDetails(selectedRestaurantId, p.key);
                    }}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      detailPeriod === p.key
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {isDetailLoading ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                <p className="text-xs font-semibold">Loading restaurant financial audit...</p>
              </div>
            ) : restaurantDetail ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Gross Revenue</span>
                    <p className="text-lg font-black text-gray-900">
                      ₹{restaurantDetail.financialSummary.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400">{restaurantDetail.financialSummary.orderCount} delivered orders</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-purple-600 uppercase">
                      Platform Commission ({restaurantDetail.restaurant.commissionRate}%)
                    </span>
                    <p className="text-lg font-black text-purple-600">
                      -₹{restaurantDetail.financialSummary.commissionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-purple-500 font-semibold">Retained by ZaykaFood</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Applicable GST</span>
                    <p className="text-lg font-black text-gray-800">
                      ₹{restaurantDetail.financialSummary.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400">Statutory tax liability</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Platform Fees</span>
                    <p className="text-lg font-black text-gray-800">
                      ₹{restaurantDetail.financialSummary.platformFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400">₹3 convenience / order</p>
                  </div>

                  <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 p-4 space-y-1">
                    <span className="text-[10px] font-black text-emerald-800 uppercase">Restaurant Net Payable</span>
                    <p className="text-xl font-black text-emerald-700">
                      ₹{restaurantDetail.financialSummary.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold">Gross minus commission</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Already Paid</span>
                    <p className="text-lg font-black text-gray-800">
                      ₹{restaurantDetail.financialSummary.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400">Disbursed to merchant</p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-1 col-span-2">
                    <span className="text-[10px] font-black text-amber-800 uppercase">Pending Settlement Payout</span>
                    <p className="text-xl font-black text-amber-700">
                      ₹{restaurantDetail.financialSummary.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-amber-600 font-semibold">Awaiting banking disbursement</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <h3 className="text-sm font-black text-gray-900">Merchant Payout Banking Information</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          restaurantDetail.bankAccount.isConfigured
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {restaurantDetail.bankAccount.isConfigured ? '✓ Bank Configured' : '⚠ Bank Account Missing'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-semibold text-[11px]">Bank Name</span>
                      <strong className="text-gray-800 font-bold">{restaurantDetail.bankAccount.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[11px]">Account Holder</span>
                      <strong className="text-gray-800 font-bold">{restaurantDetail.bankAccount.accountHolder}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[11px]">Account Number</span>
                      <strong className="text-gray-800 font-bold font-mono">{restaurantDetail.bankAccount.accountNumber}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[11px]">IFSC Code</span>
                      <strong className="text-gray-800 font-bold font-mono">{restaurantDetail.bankAccount.ifscCode}</strong>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black text-gray-900">Execute Settlement Payout</h4>
                        <p className="text-[11px] text-gray-500">
                          Disburse <strong>₹{restaurantDetail.financialSummary.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> for period: <strong>{restaurantDetail.period.label}</strong>
                        </p>
                      </div>

                      <button
                        onClick={handleProcessPayout}
                        disabled={
                          isProcessingPayout ||
                          restaurantDetail.financialSummary.netPayable <= 0 ||
                          restaurantDetail.financialSummary.status === 'SETTLED'
                        }
                        className="rounded-2xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-40 transition shrink-0"
                      >
                        {isProcessingPayout ? (
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Processing via Gateway...</span>
                          </span>
                        ) : restaurantDetail.financialSummary.status === 'SETTLED' ? (
                          'Already Settled & Paid'
                        ) : (
                          'Process Payout'
                        )}
                      </button>
                    </div>

                    {payoutSuccess && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{payoutSuccess}</span>
                      </div>
                    )}

                    {payoutError && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>{payoutError}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>Contributing Orders ({restaurantDetail.orders.length})</span>
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider sticky top-0 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2.5">Order #</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Customer</th>
                          <th className="px-4 py-2.5 text-right">Gross (₹)</th>
                          <th className="px-4 py-2.5 text-right">Commission (₹)</th>
                          <th className="px-4 py-2.5 text-right">GST (₹)</th>
                          <th className="px-4 py-2.5 text-right">Fees (₹)</th>
                          <th className="px-4 py-2.5 text-right">Restaurant Net (₹)</th>
                          <th className="px-4 py-2.5 text-center">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                        {restaurantDetail.orders.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                              No delivered orders found for this restaurant in the selected period.
                            </td>
                          </tr>
                        ) : (
                          restaurantDetail.orders.map((o) => (
                            <tr key={o.orderId} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-bold text-purple-700">#{o.orderNumber}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-[11px]">
                                {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-900">{o.customerName}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                                ₹{o.grossAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-rose-600">
                                -₹{o.commissionAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-600">₹{o.gstAmount.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">₹{o.platformFee.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-right font-black text-emerald-600">
                                ₹{o.restaurantNet.toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-black uppercase">
                                  {o.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Settlement History ({restaurantHistory.length} Past Records)</span>
                  </h3>

                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider sticky top-0 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2.5">Settlement ID</th>
                          <th className="px-4 py-2.5">Period</th>
                          <th className="px-4 py-2.5 text-center">Orders</th>
                          <th className="px-4 py-2.5 text-right">Gross (₹)</th>
                          <th className="px-4 py-2.5 text-right">Commission (₹)</th>
                          <th className="px-4 py-2.5 text-right">Net Payable (₹)</th>
                          <th className="px-4 py-2.5 text-right">Paid (₹)</th>
                          <th className="px-4 py-2.5 text-center">Status</th>
                          <th className="px-4 py-2.5">Paid Date / UTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                        {restaurantHistory.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                              No prior settlement history records found.
                            </td>
                          </tr>
                        ) : (
                          restaurantHistory.map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-mono text-[10px] text-gray-500">
                                {h.id.slice(0, 8)}...
                              </td>
                              <td className="px-4 py-2.5 text-[11px] text-gray-700">
                                {new Date(h.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {new Date(h.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </td>
                              <td className="px-4 py-2.5 text-center font-bold">{h.orderCount}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                                ₹{Number(h.grossAmount).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-rose-600 font-bold">
                                -₹{Number(h.commissionAmount).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-black text-emerald-600">
                                ₹{Number(h.netPayable).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                                ₹{Number(h.paidAmount).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                    h.status === 'SETTLED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : h.status === 'PROCESSING'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {h.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[10px] text-gray-500 font-mono">
                                {h.settledAt
                                  ? `${new Date(h.settledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}${h.utrNumber ? ` (${h.utrNumber})` : ''}`
                                  : 'Pending'}
                              </td>
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
    </div>
  );
}
