'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  TrendingUp,
  History,
  ShieldCheck,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';

const API_BASE = getApiBaseUrl();

interface SettlementDetail {
  period: { start: string; end: string; label: string };
  restaurant: { id: string; name: string; phone: string; commissionRate: number };
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
  orders: Array<{
    orderId: string;
    orderNumber: string;
    createdAt: string;
    customerName: string;
    foodSubtotal: number;
    commissionRate: number;
    commissionAmount: number;
    restaurantNet: number;
  }>;
}

interface HistoricalSettlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  grossAmount: number;
  commissionAmount: number;
  netPayable: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  utrNumber: string | null;
  settledAt: string | null;
}

export default function MerchantSettlementsPage() {
  const { user, accessToken } = useHotelAuthStore();
  const restaurantId = user?.restaurantId;

  const [periodType, setPeriodType] = useState<'current' | 'previous'>('current');
  const [detail, setDetail] = useState<SettlementDetail | null>(null);
  const [history, setHistory] = useState<HistoricalSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const fetchSettlementData = async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const [detailRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/settlements/restaurant/${restaurantId}/detail?periodType=${periodType}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }),
        fetch(`${API_BASE}/settlements/restaurant/${restaurantId}/history`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }),
      ]);

      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setDetail(detailData);
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(Array.isArray(histData) ? histData : []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementData();
  }, [restaurantId, periodType]);

  const fin = detail?.financialSummary || {
    orderCount: 0,
    grossSales: 0,
    commissionAmount: 0,
    authorizedDeductions: 0,
    netPayable: 0,
    paidAmount: 0,
    pendingAmount: 0,
    status: 'PENDING',
    utrNumber: null,
    payoutId: null,
    settledAt: null,
    failureReason: null,
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'SETTLED':
        return (
          <span className="flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800 uppercase">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="flex items-center gap-1 rounded-xl bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-800 uppercase">
            <Clock className="h-3 w-3" />
            Processing
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-xl bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800 uppercase">
            <AlertCircle className="h-3 w-3" />
            Pending Cycle
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Weekly Bank Settlements
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Authoritative weekly food sales, commission calculations &amp; bank payout history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettlementData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition min-h-[44px] ${
            activeTab === 'current'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Weekly Statement
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition min-h-[44px] ${
            activeTab === 'history'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Payout History ({history.length})
        </button>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-4">
          {/* Period Toggle */}
          <div className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-2xl">
            <span className="text-xs font-bold text-gray-600 pl-2">
              Period: <strong>{detail?.period?.label || 'Current Week'}</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPeriodType('current')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition min-h-[36px] ${
                  periodType === 'current'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Current Week
              </button>
              <button
                onClick={() => setPeriodType('previous')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition min-h-[36px] ${
                  periodType === 'previous'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Previous Week
              </button>
            </div>
          </div>

          {/* Financial Summary Cards: 2-col on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 block">GROSS FOOD SALES</span>
              <div className="text-lg sm:text-2xl font-black text-gray-900">
                ₹{fin.grossSales.toLocaleString()}
              </div>
              <span className="text-[10px] text-gray-500 block">
                {fin.orderCount} Orders delivered
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-orange-600 block">COMMISSION</span>
              <div className="text-lg sm:text-2xl font-black text-orange-600">
                -₹{fin.commissionAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-orange-700 font-semibold block">
                Platform deduction
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800 block">NET PAYABLE</span>
              <div className="text-lg sm:text-2xl font-black text-emerald-900">
                ₹{fin.netPayable.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block">
                Gross - Commission
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 block">PAYOUT STATUS</span>
              <div className="pt-1">
                {getStatusPill(fin.status)}
              </div>
              <span className="text-[10px] text-gray-500 block pt-0.5">
                {fin.utrNumber ? `UTR: ${fin.utrNumber}` : 'Scheduled Monday'}
              </span>
            </div>
          </div>

          {/* Masked Bank Account Details */}
          {detail?.bankAccount && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-900 block">
                    {detail.bankAccount.bankName || 'HDFC Bank'} • {detail.bankAccount.accountHolder || 'Registered Account'}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    A/C: **** **** {detail.bankAccount.accountNumber ? detail.bankAccount.accountNumber.slice(-4) : '4821'} (IFSC: {detail.bankAccount.ifscCode || 'HDFC0001234'})
                  </span>
                </div>
              </div>

              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Bank A/C
              </span>
            </div>
          )}

          {/* Orders Itemized Breakdown (Mobile Card / Desktop Table) */}
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-sm sm:text-base font-black text-gray-900">
              Itemized Order Settlement Logs ({detail?.orders?.length || 0})
            </h2>

            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5">
              {!detail?.orders || detail.orders.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-gray-400">
                  No completed orders in this settlement cycle.
                </div>
              ) : (
                detail.orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900">
                        #{ord.orderNumber || ord.orderId.slice(0, 8)}
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        Net: ₹{ord.restaurantNet}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span>Customer: {ord.customerName}</span>
                      <span>Subtotal: ₹{ord.foodSubtotal}</span>
                    </div>

                    <div className="text-[10px] text-orange-700 font-semibold border-t border-gray-200/60 pt-1 flex justify-between">
                      <span>Commission ({ord.commissionRate}%):</span>
                      <span>-₹{ord.commissionAmount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Gross Subtotal</th>
                    <th className="pb-3">Commission</th>
                    <th className="pb-3 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {detail?.orders?.map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">#{ord.orderNumber}</td>
                      <td className="py-3 text-gray-600">{ord.customerName}</td>
                      <td className="py-3 text-gray-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 font-bold text-gray-900">₹{ord.foodSubtotal}</td>
                      <td className="py-3 text-orange-600 font-semibold">-₹{ord.commissionAmount} ({ord.commissionRate}%)</td>
                      <td className="py-3 font-black text-emerald-700 text-right">₹{ord.restaurantNet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Payout History Tab (Mobile Card / Desktop Table) */
        <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm sm:text-base font-black text-gray-900">
            Historical Weekly Payout Cycles
          </h2>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-gray-400">
              No historical settlements found yet.
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block md:hidden space-y-2.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900">
                        {new Date(h.periodStart).toLocaleDateString()} – {new Date(h.periodEnd).toLocaleDateString()}
                      </span>
                      {getStatusPill(h.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Gross Sales</span>
                        <span className="font-bold text-gray-900">₹{h.grossAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-700 font-bold uppercase block">Net Payout</span>
                        <span className="font-black text-emerald-800">₹{h.netPayable.toLocaleString()}</span>
                      </div>
                    </div>

                    {h.utrNumber && (
                      <div className="text-[10px] font-mono text-gray-500 border-t border-gray-200/60 pt-1">
                        Bank UTR: {h.utrNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Period</th>
                      <th className="pb-3">Orders</th>
                      <th className="pb-3">Gross Sales</th>
                      <th className="pb-3">Commission</th>
                      <th className="pb-3">Net Payout</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Bank UTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900">
                          {new Date(h.periodStart).toLocaleDateString()} – {new Date(h.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-gray-600">{h.orderCount}</td>
                        <td className="py-3 font-bold text-gray-900">₹{h.grossAmount.toLocaleString()}</td>
                        <td className="py-3 text-orange-600 font-semibold">-₹{h.commissionAmount.toLocaleString()}</td>
                        <td className="py-3 font-black text-emerald-700">₹{h.netPayable.toLocaleString()}</td>
                        <td className="py-3">{getStatusPill(h.status)}</td>
                        <td className="py-3 font-mono text-gray-500 text-right">{h.utrNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
