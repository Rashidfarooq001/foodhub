'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  TrendingUp,
  History,
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
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementData();
  }, [restaurantId, periodType]);

  const summary = detail?.financialSummary;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Weekly Settlements &amp; Payouts</h1>
          <p className="text-xs text-gray-500">
            Authoritative weekly food sales, platform commission breakdowns, and bank payout records
          </p>
        </div>

        <button
          onClick={fetchSettlementData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'current' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Active Period Settlement</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'history' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Settlement History</span>
        </button>
      </div>

      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Period Selector Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-orange-100 bg-orange-50/40 p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-950">Settlement Period</span>
              </div>
              <p className="text-base font-black text-gray-900">{detail?.period?.label || 'Calculating period...'}</p>
              <p className="text-[10px] text-gray-500">Asia/Kolkata (IST) Monday 00:00:00 → Sunday 23:59:59.999</p>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-xs text-xs font-bold">
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
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Gross Food Sales</span>
              <h3 className="text-2xl font-black text-gray-900">₹{(summary?.grossSales ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-gray-400">{summary?.orderCount ?? 0} delivered orders</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Platform Commission</span>
              <h3 className="text-2xl font-black text-blue-600">₹{(summary?.commissionAmount ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-blue-600 font-bold">Rate: {detail?.restaurant?.commissionRate ?? 0}%</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Net Payable</span>
              <h3 className="text-2xl font-black text-purple-700">₹{(summary?.netPayable ?? 0).toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-gray-400">Gross sales - commission</p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Settlement Status</span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                    summary?.status === 'SETTLED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : summary?.status === 'PROCESSING'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {summary?.status || 'PENDING'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-orange-600">Pending Payout: ₹{(summary?.pendingAmount ?? 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Registered Bank Account */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Registered Bank Payout Account</h3>
            {detail?.bankAccount ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block">Bank Name</span>
                  <span className="font-bold text-gray-900">{detail.bankAccount.bankName}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Account Number</span>
                  <span className="font-mono font-bold text-gray-900">{detail.bankAccount.accountNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">IFSC Code</span>
                  <span className="font-mono font-bold text-gray-900">{detail.bankAccount.ifscCode}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No bank account registered. Contact ZaykaFood support to configure payout details.</p>
            )}
          </div>

          {/* Order-Level Breakdown Table */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900">Period Orders Breakdown ({detail?.orders?.length ?? 0})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Order #</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-4 py-3.5 text-right">Food Amount</th>
                    <th className="px-4 py-3.5 text-right">Commission</th>
                    <th className="px-6 py-3.5 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold">
                        Loading order details...
                      </td>
                    </tr>
                  ) : !detail?.orders || detail.orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold">
                        No delivered orders in this settlement period.
                      </td>
                    </tr>
                  ) : (
                    detail.orders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3.5 font-bold text-gray-900">{ord.orderNumber}</td>
                        <td className="px-6 py-3.5 text-gray-600">{ord.customerName}</td>
                        <td className="px-4 py-3.5 text-right font-black text-gray-900">₹{ord.foodSubtotal}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-blue-600">₹{ord.commissionAmount}</td>
                        <td className="px-6 py-3.5 text-right font-black text-purple-700">₹{ord.restaurantNet}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900">Historical Weekly Settlements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Settlement Period</th>
                  <th className="px-4 py-4 text-center">Orders</th>
                  <th className="px-4 py-4 text-right">Gross Sales</th>
                  <th className="px-4 py-4 text-right">Commission</th>
                  <th className="px-4 py-4 text-right">Net Payable</th>
                  <th className="px-4 py-4 text-right">Paid Amount</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-6 py-4">UTR Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold">
                      No historical settlement records found.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {new Date(h.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} →{' '}
                        {new Date(h.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 text-center font-bold">{h.orderCount}</td>
                      <td className="px-4 py-4 text-right font-black">₹{Number(h.grossAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right text-blue-600 font-bold">₹{Number(h.commissionAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right font-black text-purple-700">₹{Number(h.netPayable).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-600">₹{Number(h.paidAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{h.utrNumber || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
