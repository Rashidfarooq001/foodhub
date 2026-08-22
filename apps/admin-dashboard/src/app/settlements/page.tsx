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
  Bike,
  History,
  Activity,
  User,
  Check,
  ShieldAlert,
  ArrowDownLeft,
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

export type FinanceTab = 'overview' | 'restaurants' | 'riders' | 'transactions' | 'audit';
export type PeriodType = 'today' | 'this_week' | 'previous_week' | 'this_month' | 'previous_month' | 'custom';

export interface FinanceOverviewData {
  orderCount: number;
  grossSales: number;
  restaurantPayable: number;
  riderPayable: number;
  zaykaRevenue: number;
  pendingRestaurantSettlements: number;
  pendingRiderSettlements: number;
  paidRestaurantSettlements: number;
  paidRiderSettlements: number;
  failedSettlements: number;
}

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
  settledAt?: string | null;
}

export interface RiderSettlementRow {
  driverId: string;
  driverName: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  completedDeliveries: number;
  totalEarnings: number;
  paidAmount: number;
  pendingAmount: number;
  settlementStatus: string;
  lastSettlementDate?: string | null;
  lastUtrNumber?: string | null;
}

export interface TransactionRow {
  id: string;
  date: string;
  type: 'CUSTOMER_PAYMENT' | 'RESTAURANT_SETTLEMENT' | 'RIDER_SETTLEMENT' | 'REFUND';
  orderNumber: string;
  recipientOrPayer: string;
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW';
  status: string;
  reference: string;
  processedBy: string;
}

export interface AuditLogRow {
  id: string;
  adminId: string;
  adminName: string;
  entityName: string;
  entityId: string;
  action: string;
  recipient: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  notes?: string;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
}

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [periodType, setPeriodType] = useState<PeriodType>('this_week');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Overview State
  const [overview, setOverview] = useState<FinanceOverviewData | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>('This Week');

  // Restaurant Settlements State
  const [restaurants, setRestaurants] = useState<RestaurantSettlementRow[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState<string>('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSettlementRow | null>(null);
  const [restaurantDetailData, setRestaurantDetailData] = useState<any | null>(null);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isRestaurantPayModalOpen, setIsRestaurantPayModalOpen] = useState(false);

  // Rider Settlements State
  const [riders, setRiders] = useState<RiderSettlementRow[]>([]);
  const [riderSearch, setRiderSearch] = useState<string>('');
  const [selectedRider, setSelectedRider] = useState<RiderSettlementRow | null>(null);
  const [riderDetailData, setRiderDetailData] = useState<any | null>(null);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [isRiderPayModalOpen, setIsRiderPayModalOpen] = useState(false);

  // Manual Settlement Payment Form State
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'OTHER'>('BANK_TRANSFER');
  const [payReference, setPayReference] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState<string | null>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('ALL');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  // Pagination & Loading
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Build query string for period
  const getPeriodQuery = useCallback(() => {
    let q = `periodType=${periodType}`;
    if (periodType === 'custom' && customStart && customEnd) {
      q += `&customStart=${encodeURIComponent(customStart)}&customEnd=${encodeURIComponent(customEnd)}`;
    }
    return q;
  }, [periodType, customStart, customEnd]);

  // Load Data based on active tab & period
  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true);
    setPaymentSuccessMsg(null);
    setPaymentErrorMsg(null);

    const q = getPeriodQuery();

    try {
      if (activeTab === 'overview') {
        const res = await adminFetch(`/settlements/overview?${q}`);
        if (res.ok) {
          const data = await res.json();
          setOverview(data.overview);
          setPeriodLabel(data.period?.label || 'Selected Period');
        }
      } else if (activeTab === 'restaurants') {
        const res = await adminFetch(`/settlements/weekly?${q}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurants(data.restaurants || []);
          setPeriodLabel(data.period?.label || 'Selected Period');
        }
      } else if (activeTab === 'riders') {
        const res = await adminFetch(`/settlements/riders?${q}`);
        if (res.ok) {
          const data = await res.json();
          setRiders(data.riders || []);
          setPeriodLabel(data.period?.label || 'Selected Period');
        }
      } else if (activeTab === 'transactions') {
        const res = await adminFetch(`/settlements/transactions?${q}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
          setPeriodLabel(data.period?.label || 'Selected Period');
        }
      } else if (activeTab === 'audit') {
        const res = await adminFetch('/settlements/audit-logs');
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, getPeriodQuery]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Fetch restaurant details
  const openRestaurantDetails = async (row: RestaurantSettlementRow) => {
    setSelectedRestaurant(row);
    setIsRestaurantModalOpen(true);
    setRestaurantDetailData(null);
    try {
      const q = getPeriodQuery();
      const res = await adminFetch(`/settlements/restaurant/${row.restaurantId}/detail?${q}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurantDetailData(data);
      }
    } catch {
      // ignore
    }
  };

  // Fetch rider details
  const openRiderDetails = async (row: RiderSettlementRow) => {
    setSelectedRider(row);
    setIsRiderModalOpen(true);
    setRiderDetailData(null);
    try {
      const q = getPeriodQuery();
      const res = await adminFetch(`/settlements/rider/${row.driverId}/detail?${q}`);
      if (res.ok) {
        const data = await res.json();
        setRiderDetailData(data);
      }
    } catch {
      // ignore
    }
  };

  // Open Pay Restaurant Settlement Modal
  const openPayRestaurantModal = (row: RestaurantSettlementRow) => {
    setSelectedRestaurant(row);
    setPayAmount(String(row.pendingAmount > 0 ? row.pendingAmount : row.netPayable));
    setPayMethod('BANK_TRANSFER');
    setPayReference('');
    setPayNotes('');
    setPaymentSuccessMsg(null);
    setPaymentErrorMsg(null);
    setShowConfirmModal(false);
    setIsRestaurantPayModalOpen(true);
  };

  // Open Pay Rider Settlement Modal
  const openPayRiderModal = (row: RiderSettlementRow) => {
    setSelectedRider(row);
    setPayAmount(String(row.pendingAmount > 0 ? row.pendingAmount : row.totalEarnings));
    setPayMethod('UPI');
    setPayReference('');
    setPayNotes('');
    setPaymentSuccessMsg(null);
    setPaymentErrorMsg(null);
    setShowConfirmModal(false);
    setIsRiderPayModalOpen(true);
  };

  // Handle Record Restaurant Payment
  const handleRecordRestaurantPayment = async () => {
    if (!selectedRestaurant) return;
    if (!payReference.trim()) {
      setPaymentErrorMsg('Transaction reference (UTR / Ref Number) is strictly required.');
      return;
    }
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentErrorMsg(null);

    try {
      const res = await adminFetch(`/settlements/restaurant/${selectedRestaurant.restaurantId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: payMethod,
          transactionReference: payReference.trim(),
          notes: payNotes.trim() || undefined,
          periodType,
          customStart: customStart || undefined,
          customEnd: customEnd || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record manual settlement.');
      }

      setPaymentSuccessMsg(data.message || 'Manual restaurant settlement recorded successfully.');
      setShowConfirmModal(false);
      setIsRestaurantPayModalOpen(false);
      setIsRestaurantModalOpen(false);
      fetchFinanceData();
    } catch (err: any) {
      setPaymentErrorMsg(err.message || 'An error occurred while recording the manual settlement.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle Record Rider Payment
  const handleRecordRiderPayment = async () => {
    if (!selectedRider) return;
    if (!payReference.trim()) {
      setPaymentErrorMsg('Transaction reference (UTR / Ref Number) is strictly required.');
      return;
    }
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentErrorMsg(null);

    try {
      const res = await adminFetch(`/settlements/rider/${selectedRider.driverId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: payMethod,
          transactionReference: payReference.trim(),
          notes: payNotes.trim() || undefined,
          periodType,
          customStart: customStart || undefined,
          customEnd: customEnd || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to record manual rider settlement.');
      }

      setPaymentSuccessMsg(data.message || 'Manual rider settlement recorded successfully.');
      setShowConfirmModal(false);
      setIsRiderPayModalOpen(false);
      setIsRiderModalOpen(false);
      fetchFinanceData();
    } catch (err: any) {
      setPaymentErrorMsg(err.message || 'An error occurred while recording the rider settlement.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Filtered Restaurant Rows
  const filteredRestaurants = useMemo(() => {
    if (!restaurantSearch.trim()) return restaurants;
    const s = restaurantSearch.toLowerCase().trim();
    return restaurants.filter((r) => {
      const name = (r.restaurantName || '').toLowerCase();
      const id = (r.restaurantId || '').toLowerCase();
      const owner = (r.ownerName || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const settleId = (r.settlementId || '').toLowerCase();
      return name.includes(s) || id.includes(s) || owner.includes(s) || phone.includes(s) || email.includes(s) || settleId.includes(s);
    });
  }, [restaurants, restaurantSearch]);

  // Filtered Rider Rows
  const filteredRiders = useMemo(() => {
    if (!riderSearch.trim()) return riders;
    const s = riderSearch.toLowerCase().trim();
    return riders.filter((r) => {
      const name = (r.driverName || '').toLowerCase();
      const id = (r.driverId || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const vehicle = (r.vehicleNumber || '').toLowerCase();
      return name.includes(s) || id.includes(s) || phone.includes(s) || vehicle.includes(s);
    });
  }, [riders, riderSearch]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (transactionTypeFilter === 'ALL') return transactions;
    return transactions.filter((t) => t.type === transactionTypeFilter);
  }, [transactions, transactionTypeFilter]);

  // Pagination for restaurants
  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage) || 1;
  const paginatedRestaurants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRestaurants.slice(start, start + itemsPerPage);
  }, [filteredRestaurants, currentPage]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Finance &amp; Manual Settlements
            </h1>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-700">
              Manual Settlement Mode
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative financial ledger, merchant settlements, rider earnings &amp; audited manual disbursement records
          </p>
        </div>

        <button
          onClick={fetchFinanceData}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition shadow-sm min-h-[40px]"
        >
          <RefreshCw className={`h-4 w-4 text-purple-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Success / Error Feedback */}
      {paymentSuccessMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{paymentSuccessMsg}</span>
          </div>
          <button onClick={() => setPaymentSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {paymentErrorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-bold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{paymentErrorMsg}</span>
          </div>
          <button onClick={() => setPaymentErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => { setActiveTab('overview'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Finance Overview</span>
        </button>

        <button
          onClick={() => { setActiveTab('restaurants'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'restaurants'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Restaurant Settlements</span>
        </button>

        <button
          onClick={() => { setActiveTab('riders'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'riders'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bike className="h-4 w-4" />
          <span>Rider Settlements</span>
        </button>

        <button
          onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'transactions'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Transactions</span>
        </button>

        <button
          onClick={() => { setActiveTab('audit'); setCurrentPage(1); }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Period Selector Bar */}
      {activeTab !== 'audit' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Period:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'previous_week', label: 'Previous Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'previous_month', label: 'Previous Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodType(p.id as PeriodType)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  periodType === p.id
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodType === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-gray-200 px-2.5 py-1 text-xs text-gray-700 bg-white"
              />
              <span className="text-xs text-gray-400 font-bold">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-gray-200 px-2.5 py-1 text-xs text-gray-700 bg-white"
              />
              <button
                onClick={fetchFinanceData}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 transition"
              >
                Apply
              </button>
            </div>
          )}

          <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-purple-600" />
            <span>Active: <strong className="text-gray-900">{periodLabel}</strong></span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: FINANCE OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Core Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-purple-100 bg-gradient-to-tr from-purple-50/70 to-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">GROSS SALES (GMV)</span>
                <Banknote className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{(overview?.grossSales ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold">
                {overview?.orderCount ?? 0} completed customer orders
              </p>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-tr from-indigo-50/70 to-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">RESTAURANT PAYABLE</span>
                <Store className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{(overview?.restaurantPayable ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold">
                Gross sales minus platform commissions
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-tr from-emerald-50/70 to-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">RIDER PAYABLE</span>
                <Bike className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{(overview?.riderPayable ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold">
                Base pay + distance delivery compensations
              </p>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-gradient-to-tr from-amber-50/70 to-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">ZAYKA REVENUE</span>
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{(overview?.zaykaRevenue ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold">
                Platform commissions + convenience fees
              </p>
            </div>
          </div>

          {/* Secondary Settlement Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">PENDING RESTAURANT SETTLEMENTS</span>
              <div className="text-xl font-black text-amber-900">
                ₹{(overview?.pendingRestaurantSettlements ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-700 font-semibold block">Awaiting manual bank/UPI transfer</span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">PENDING RIDER SETTLEMENTS</span>
              <div className="text-xl font-black text-amber-900">
                ₹{(overview?.pendingRiderSettlements ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-700 font-semibold block">Awaiting manual rider payout</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">PAID RESTAURANT SETTLEMENTS</span>
              <div className="text-xl font-black text-emerald-900">
                ₹{(overview?.paidRestaurantSettlements ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block">Disbursed with verified transaction UTR</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">PAID RIDER SETTLEMENTS</span>
              <div className="text-xl font-black text-emerald-900">
                ₹{(overview?.paidRiderSettlements ?? 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block">Settled with verified transaction reference</span>
            </div>
          </div>

          {/* Policy Information Box */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <span>Authoritative Manual Settlement Standard Operating Procedure</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="font-bold text-gray-900 block">1. Customer Collection</span>
                <p>Customers pay via Razorpay or COD. All funds flow strictly into Zayka Food platform accounts.</p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="font-bold text-gray-900 block">2. External Bank/UPI Transfer</span>
                <p>Admin transfers net earnings directly through corporate banking / UPI outside the app.</p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="font-bold text-gray-900 block">3. Audited Record Keeping</span>
                <p>Admin enters UTR/Ref # and notes. Server updates database ledger and writes immutable audit logs.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RESTAURANT SETTLEMENTS */}
      {/* ======================================================== */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search restaurant, ID, owner, phone, email, settlement ID..."
                value={restaurantSearch}
                onChange={(e) => { setRestaurantSearch(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
              />
            </div>
            <div className="text-xs text-gray-500 font-bold">
              Showing {filteredRestaurants.length} restaurants
            </div>
          </div>

          {/* Restaurant Table */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3.5">Restaurant</th>
                    <th className="px-3 py-3.5 text-center">Orders</th>
                    <th className="px-3 py-3.5 text-right">Gross Sales</th>
                    <th className="px-3 py-3.5 text-right">Commission</th>
                    <th className="px-3 py-3.5 text-right">Adjustments</th>
                    <th className="px-3 py-3.5 text-right">Net Payable</th>
                    <th className="px-3 py-3.5 text-right">Paid</th>
                    <th className="px-3 py-3.5 text-right">Pending</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                        <Store className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="font-bold">No restaurant settlement records found.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRestaurants.map((r) => {
                      const isFullySettled = r.pendingAmount <= 0 && r.netPayable > 0;
                      const isPartial = r.paidAmount > 0 && r.pendingAmount > 0;

                      return (
                        <tr key={r.restaurantId} className="hover:bg-purple-50/30 transition group">
                          <td className="px-4 py-3.5 font-medium">
                            <button
                              onClick={() => openRestaurantDetails(r)}
                              className="text-left font-bold text-gray-900 group-hover:text-purple-600 transition block truncate max-w-[200px]"
                            >
                              {r.restaurantName}
                            </button>
                            <span className="text-[10px] text-gray-400 block truncate">
                              Owner: {r.ownerName || 'Merchant'} • {r.phone || 'No phone'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-center font-bold text-gray-700">
                            {r.orderCount}
                          </td>
                          <td className="px-3 py-3.5 text-right font-bold text-gray-900">
                            ₹{r.grossSales.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-right text-purple-700 font-bold">
                            ₹{r.commissionAmount.toLocaleString('en-IN')}
                            <span className="text-[9px] text-gray-400 block">({r.commissionRate}%)</span>
                          </td>
                          <td className="px-3 py-3.5 text-right text-gray-500 font-semibold">
                            ₹{r.authorizedDeductions || 0}
                          </td>
                          <td className="px-3 py-3.5 text-right font-black text-gray-900">
                            ₹{r.netPayable.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-right text-emerald-700 font-bold">
                            ₹{r.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-right font-black text-amber-700">
                            ₹{r.pendingAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                isFullySettled || r.status === 'SETTLED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPartial || r.status === 'PROCESSING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isFullySettled || r.status === 'SETTLED' ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openRestaurantDetails(r)}
                                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-700 transition"
                              >
                                View Details
                              </button>
                              {r.pendingAmount > 0 && (
                                <button
                                  onClick={() => openPayRestaurantModal(r)}
                                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs font-bold transition shadow-sm"
                                >
                                  Pay Settlement
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: RIDER SETTLEMENTS */}
      {/* ======================================================== */}
      {activeTab === 'riders' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rider name, phone, vehicle number..."
                value={riderSearch}
                onChange={(e) => setRiderSearch(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
              />
            </div>
            <div className="text-xs text-gray-500 font-bold">
              Showing {filteredRiders.length} delivery partners
            </div>
          </div>

          {/* Rider Table */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3.5">Rider</th>
                    <th className="px-3 py-3.5">Vehicle</th>
                    <th className="px-3 py-3.5 text-center">Completed Deliveries</th>
                    <th className="px-3 py-3.5 text-right">Total Earnings</th>
                    <th className="px-3 py-3.5 text-right">Paid</th>
                    <th className="px-3 py-3.5 text-right">Pending</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRiders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        <Bike className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="font-bold">No rider settlement records found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRiders.map((r) => {
                      const isFullySettled = r.pendingAmount <= 0 && r.totalEarnings > 0;
                      return (
                        <tr key={r.driverId} className="hover:bg-purple-50/30 transition group">
                          <td className="px-4 py-3.5 font-medium">
                            <button
                              onClick={() => openRiderDetails(r)}
                              className="text-left font-bold text-gray-900 group-hover:text-purple-600 transition block"
                            >
                              {r.driverName}
                            </button>
                            <span className="text-[10px] text-gray-400 block">{r.phone}</span>
                          </td>
                          <td className="px-3 py-3.5 text-gray-600 font-semibold">
                            {r.vehicleNumber} ({r.vehicleType})
                          </td>
                          <td className="px-3 py-3.5 text-center font-bold text-gray-700">
                            {r.completedDeliveries}
                          </td>
                          <td className="px-3 py-3.5 text-right font-black text-gray-900">
                            ₹{r.totalEarnings.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-right text-emerald-700 font-bold">
                            ₹{r.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-right font-black text-amber-700">
                            ₹{r.pendingAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                isFullySettled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.paidAmount > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isFullySettled ? 'PAID' : r.paidAmount > 0 ? 'PARTIAL' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openRiderDetails(r)}
                                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-700 transition"
                              >
                                View Details
                              </button>
                              {r.pendingAmount > 0 && (
                                <button
                                  onClick={() => openPayRiderModal(r)}
                                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs font-bold transition shadow-sm"
                                >
                                  Pay Rider
                                </button>
                              )}
                            </div>
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

      {/* ======================================================== */}
      {/* TAB 4: TRANSACTIONS */}
      {/* ======================================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500">Filter Type:</span>
              {['ALL', 'CUSTOMER_PAYMENT', 'RESTAURANT_SETTLEMENT', 'RIDER_SETTLEMENT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTransactionTypeFilter(t)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    transactionTypeFilter === t
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 font-bold">
              {filteredTransactions.length} recorded transactions
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3.5">Date &amp; Time</th>
                    <th className="px-3 py-3.5">Type</th>
                    <th className="px-3 py-3.5">Reference / Order</th>
                    <th className="px-3 py-3.5">Recipient / Payer</th>
                    <th className="px-3 py-3.5 text-right">Amount</th>
                    <th className="px-3 py-3.5 text-center">Direction</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Processed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500 font-bold">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5 text-gray-600 font-medium">
                          {new Date(t.date).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                              t.type === 'CUSTOMER_PAYMENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.type === 'RESTAURANT_SETTLEMENT'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {t.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-bold text-gray-900">
                          {t.orderNumber}
                          <span className="text-[10px] text-gray-400 block">{t.reference}</span>
                        </td>
                        <td className="px-3 py-3.5 text-gray-700 font-medium">{t.recipientOrPayer}</td>
                        <td className="px-3 py-3.5 text-right font-black text-gray-900">
                          ₹{t.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold">
                          {t.direction === 'INFLOW' ? (
                            <span className="text-emerald-600 flex items-center justify-center gap-0.5">
                              <ArrowDownLeft className="h-3.5 w-3.5" /> INFLOW
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center justify-center gap-0.5">
                              <ArrowUpRight className="h-3.5 w-3.5" /> OUTFLOW
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-500 font-semibold">{t.processedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: AUDIT LOG */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-purple-600" />
              <span>Immutable Financial Audit Ledger</span>
            </h3>
            <span className="text-xs text-gray-500 font-bold">{auditLogs.length} audit entries</span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3.5">Server Timestamp</th>
                    <th className="px-3 py-3.5">Admin</th>
                    <th className="px-3 py-3.5">Entity</th>
                    <th className="px-3 py-3.5">Recipient</th>
                    <th className="px-3 py-3.5 text-right">Amount</th>
                    <th className="px-3 py-3.5">Method</th>
                    <th className="px-3 py-3.5">UTR / Reference</th>
                    <th className="px-3 py-3.5 text-center">Transition</th>
                    <th className="px-4 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500 font-bold">
                        No financial audit records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5 text-gray-600 font-medium whitespace-nowrap">
                          {new Date(l.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-3.5 font-bold text-gray-900">{l.adminName}</td>
                        <td className="px-3 py-3.5 text-purple-700 font-semibold">{l.entityName}</td>
                        <td className="px-3 py-3.5 font-bold text-gray-800">{l.recipient}</td>
                        <td className="px-3 py-3.5 text-right font-black text-gray-900">
                          ₹{Number(l.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-gray-600">{l.paymentMethod}</td>
                        <td className="px-3 py-3.5 font-mono text-purple-800 font-bold">{l.transactionReference}</td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-700">
                            <span className="text-amber-700">{l.previousStatus}</span>
                            <span>→</span>
                            <span className="text-emerald-700 font-black">{l.newStatus}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 max-w-[150px] truncate">{l.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESTAURANT EARNINGS DETAIL */}
      {/* ======================================================== */}
      {isRestaurantModalOpen && selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {selectedRestaurant.restaurantName} — Settlement Details
                </h2>
                <p className="text-xs text-gray-500">
                  Owner: {selectedRestaurant.ownerName || 'Merchant'} • ID: {selectedRestaurant.restaurantId}
                </p>
              </div>
              <button
                onClick={() => setIsRestaurantModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">GROSS SALES</span>
                <div className="text-lg font-black text-gray-900">
                  ₹{selectedRestaurant.grossSales.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-purple-700 uppercase">COMMISSION ({selectedRestaurant.commissionRate}%)</span>
                <div className="text-lg font-black text-purple-900">
                  ₹{selectedRestaurant.commissionAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">TOTAL PAID</span>
                <div className="text-lg font-black text-emerald-900">
                  ₹{selectedRestaurant.paidAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase">PENDING PAYABLE</span>
                <div className="text-lg font-black text-amber-900">
                  ₹{selectedRestaurant.pendingAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Banking Details & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="space-y-1 text-xs text-gray-700">
                <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span>Bank Account Information:</span>
                </span>
                <p>
                  <strong>{selectedRestaurant.bankDetails?.bankName || 'Bank'}</strong> • A/C: {selectedRestaurant.bankDetails?.accountNumber || 'Not Configured'} • IFSC: {selectedRestaurant.bankDetails?.ifscCode || 'N/A'}
                </p>
                <p className="text-[11px] text-gray-500">
                  Beneficiary: {selectedRestaurant.bankDetails?.accountHolder || selectedRestaurant.restaurantName}
                </p>
              </div>

              {selectedRestaurant.pendingAmount > 0 && (
                <button
                  onClick={() => openPayRestaurantModal(selectedRestaurant)}
                  className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 text-xs transition shadow-md whitespace-nowrap"
                >
                  Record Manual Payment
                </button>
              )}
            </div>

            {/* Order Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Order-Level Ledger ({restaurantDetailData?.orders?.length || 0} orders)
              </h4>
              <div className="overflow-x-auto max-h-72 rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2.5">Order #</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5 text-right">Gross</th>
                      <th className="px-2 py-2.5 text-center">Rate</th>
                      <th className="px-3 py-2.5 text-right">Commission</th>
                      <th className="px-3 py-2.5 text-right">GST / Tax</th>
                      <th className="px-3 py-2.5 text-right">Fees</th>
                      <th className="px-3 py-2.5 text-right">Net</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {!restaurantDetailData?.orders || restaurantDetailData.orders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-6 text-center text-gray-400">
                          No order transactions recorded for this period.
                        </td>
                      </tr>
                    ) : (
                      restaurantDetailData.orders.map((o: any) => (
                        <tr key={o.orderId} className="hover:bg-purple-50/20 transition">
                          <td className="px-3 py-2.5 font-bold text-gray-900">{o.orderNumber}</td>
                          <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 max-w-[120px] truncate">{o.customerName}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-gray-900">₹{o.grossAmount || o.foodSubtotal}</td>
                          <td className="px-2 py-2.5 text-center font-bold text-purple-700">{o.commissionRate || 13}%</td>
                          <td className="px-3 py-2.5 text-right text-purple-700 font-bold">-₹{o.commissionAmount}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">₹{o.gstAmount || 0}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">₹{o.platformFee || 0}</td>
                          <td className="px-3 py-2.5 text-right font-black text-emerald-700">₹{o.restaurantNet}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                              {o.settlementStatus || 'PENDING'}
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
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RIDER EARNINGS DETAIL */}
      {/* ======================================================== */}
      {isRiderModalOpen && selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {selectedRider.driverName} — Rider Earnings
                </h2>
                <p className="text-xs text-gray-500">
                  Phone: {selectedRider.phone} • Vehicle: {selectedRider.vehicleNumber}
                </p>
              </div>
              <button
                onClick={() => setIsRiderModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">DELIVERIES</span>
                <div className="text-lg font-black text-gray-900">
                  {selectedRider.completedDeliveries} trips
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">TOTAL EARNINGS</span>
                <div className="text-lg font-black text-indigo-900">
                  ₹{selectedRider.totalEarnings.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">TOTAL PAID</span>
                <div className="text-lg font-black text-emerald-900">
                  ₹{selectedRider.paidAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase">PENDING PAYABLE</span>
                <div className="text-lg font-black text-amber-900">
                  ₹{selectedRider.pendingAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Pay Action */}
            {selectedRider.pendingAmount > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="text-xs text-purple-900 font-semibold">
                  Pending manual rider disbursement: <strong>₹{selectedRider.pendingAmount}</strong>
                </div>
                <button
                  onClick={() => openPayRiderModal(selectedRider)}
                  className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 text-xs transition shadow-md"
                >
                  Record Rider Payment
                </button>
              </div>
            )}

            {/* Delivery Jobs Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Delivered Jobs Ledger ({riderDetailData?.deliveries?.length || 0} trips)
              </h4>
              <div className="overflow-x-auto max-h-60 rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2">Order #</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2 text-center">Distance</th>
                      <th className="px-3 py-2 text-right">Base Pay</th>
                      <th className="px-3 py-2 text-right">Distance Pay</th>
                      <th className="px-3 py-2 text-right">Total Earning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!riderDetailData?.deliveries || riderDetailData.deliveries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                          No delivery jobs in this period.
                        </td>
                      </tr>
                    ) : (
                      riderDetailData.deliveries.map((d: any) => (
                        <tr key={d.jobId || d.orderId} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-bold text-gray-900">{d.orderNumber}</td>
                          <td className="px-3 py-2 text-gray-700">{d.customerName}</td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-600">{d.distanceKm} km</td>
                          <td className="px-3 py-2 text-right">₹{d.baseEarning}</td>
                          <td className="px-3 py-2 text-right">₹{d.distanceEarning}</td>
                          <td className="px-3 py-2 text-right font-black text-emerald-700">₹{d.totalEarning}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MANUAL RESTAURANT PAYMENT FORM */}
      {/* ======================================================== */}
      {isRestaurantPayModalOpen && selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">Record Restaurant Payment</h3>
                <p className="text-xs text-purple-700 font-bold">{selectedRestaurant.restaurantName}</p>
              </div>
              <button onClick={() => setIsRestaurantPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900">
                <p className="font-bold">Manual Settlement Notice:</p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Clicking “Record Payment” does not transfer funds automatically. It records your external bank/UPI transfer in the Zayka Food ledger.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-sm font-black text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Pending Balance: ₹{selectedRestaurant.pendingAmount} (Partial payments supported)
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BANK_TRANSFER', 'UPI', 'OTHER'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`p-2.5 rounded-2xl text-xs font-bold border transition ${
                        payMethod === m
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Transaction Reference (UTR / Ref Number) *</label>
                <input
                  type="text"
                  placeholder="e.g. UTR928374619284 / UPI-Ref-129"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding this settlement disbursement..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-2 text-xs text-gray-900"
                />
              </div>
            </div>

            {paymentErrorMsg && (
              <p className="text-xs font-bold text-rose-600">{paymentErrorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsRestaurantPayModalOpen(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!payReference.trim() || !payAmount}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold transition shadow-md disabled:opacity-50"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MANUAL RIDER PAYMENT FORM */}
      {/* ======================================================== */}
      {isRiderPayModalOpen && selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">Record Rider Settlement Payment</h3>
                <p className="text-xs text-purple-700 font-bold">{selectedRider.driverName}</p>
              </div>
              <button onClick={() => setIsRiderPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900">
                <p className="font-bold">Manual Rider Settlement Notice:</p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Make sure you have completed the payout through UPI/bank transfer before recording.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-sm font-black text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Pending Balance: ₹{selectedRider.pendingAmount}
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'BANK_TRANSFER', 'OTHER'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`p-2.5 rounded-2xl text-xs font-bold border transition ${
                        payMethod === m
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Transaction Reference (UTR / UPI Ref) *</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TXN-98472918471"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding this rider payment..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-2 text-xs text-gray-900"
                />
              </div>
            </div>

            {paymentErrorMsg && (
              <p className="text-xs font-bold text-rose-600">{paymentErrorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsRiderPayModalOpen(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!payReference.trim() || !payAmount}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold transition shadow-md disabled:opacity-50"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900">Confirm Payment Record</h4>
                <p className="text-xs text-gray-500">Verify external manual transaction</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-2">
              <p>
                You are recording a manual settlement of{' '}
                <strong className="text-purple-700 text-sm">₹{payAmount}</strong> for{' '}
                <strong className="text-gray-900">
                  {selectedRestaurant?.restaurantName || selectedRider?.driverName}
                </strong>
                .
              </p>
              <p className="text-gray-500 text-[11px]">
                Reference: <strong className="text-gray-800">{payReference}</strong> ({payMethod})
              </p>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-800 text-[11px] font-semibold border border-amber-200">
                Make sure the payment has already been completed through your bank/UPI before recording this settlement.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmittingPayment}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={selectedRestaurant ? handleRecordRestaurantPayment : handleRecordRiderPayment}
                disabled={isSubmittingPayment}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingPayment && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Payment Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
