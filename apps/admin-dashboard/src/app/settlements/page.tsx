'use client';

import React, { useState, useEffect } from 'react';
import { Banknote, TrendingUp, Clock, RefreshCw, CheckCircle2, ShieldCheck, Bike, Store, ArrowUpRight } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface SettlementOverviewData {
  summary: {
    totalGrossGmv: number;
    totalCommissionRevenue: number;
    totalPlatformFees: number;
    totalDeliveryFees: number;
    netPlatformRevenue: number;
  };
  restaurantSettlements: Array<{
    restaurantId: string;
    name: string;
    phone: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    orderCount: number;
    grossAmount: number;
    commissionRate: number;
    commissionAmount: number;
    netPayable: number;
    status: string;
    lastSettledAt: string | null;
    utrNumber: string | null;
  }>;
  riderSettlements: Array<{
    driverId: string;
    name: string;
    phone: string;
    vehicleType: string;
    licenseNumber: string;
    completedDeliveries: number;
    grossEarnings: number;
    pendingSettlement: number;
    paidAmount: number;
    bankDetails: string;
    status: string;
  }>;
  settlementsHistory: Array<{
    id: string;
    restaurantId: string;
    amount: number;
    utrNumber: string;
    settledAt: string;
  }>;
}

export default function AdminSettlementsPage() {
  const [activeTab, setActiveTab] = useState<'RESTAURANTS' | 'RIDERS' | 'PLATFORM_REVENUE'>('RESTAURANTS');
  const [data, setData] = useState<SettlementOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/settlements/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleSettleRestaurant = async (restaurantId: string) => {
    setSettlingId(restaurantId);
    try {
      const res = await adminFetch(`/settlements/restaurant/${restaurantId}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchSettlements();
      }
    } catch {
      /* offline */
    } finally {
      setSettlingId(null);
    }
  };

  const summary = data?.summary || {
    totalGrossGmv: 0,
    totalCommissionRevenue: 0,
    totalPlatformFees: 0,
    totalDeliveryFees: 0,
    netPlatformRevenue: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Financial Settlements &amp; Revenue</h1>
          <p className="text-xs text-gray-500">Merchant net payouts, gig rider balances &amp; platform yield ledger</p>
        </div>
        <button
          onClick={fetchSettlements}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Financial Ledger</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Gross Platform GMV</p>
          <h3 className="text-2xl font-black text-gray-900">₹{summary.totalGrossGmv.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-gray-400 font-bold">Total customer checkout volume</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Commission Yield</p>
          <h3 className="text-2xl font-black text-emerald-600">₹{summary.totalCommissionRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-emerald-600 font-bold">Merchant revenue deductions (15%)</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Platform Fees</p>
          <h3 className="text-2xl font-black text-purple-600">₹{summary.totalPlatformFees.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-purple-600 font-bold">₹3 flat platform convenience fees</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Net Platform Revenue</p>
          <h3 className="text-2xl font-black text-indigo-600">₹{summary.netPlatformRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-[10px] text-indigo-600 font-bold">Total earnings across all channels</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('RESTAURANTS')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'RESTAURANTS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Restaurant Settlements ({data?.restaurantSettlements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('RIDERS')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'RIDERS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Bike className="h-4 w-4" />
          <span>Rider Settlements ({data?.riderSettlements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('PLATFORM_REVENUE')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === 'PLATFORM_REVENUE'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Platform Revenue Audit</span>
        </button>
      </div>

      {/* TAB 1: RESTAURANT SETTLEMENTS */}
      {activeTab === 'RESTAURANTS' && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Restaurant &amp; Bank</th>
                  <th className="px-6 py-4">Delivered Orders</th>
                  <th className="px-6 py-4">Gross Sales</th>
                  <th className="px-6 py-4">Commission Snapshot</th>
                  <th className="px-6 py-4">Net Payable</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading merchant ledger...</td>
                  </tr>
                ) : (data?.restaurantSettlements || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No restaurants found.</td>
                  </tr>
                ) : (
                  data?.restaurantSettlements.map((r) => (
                    <tr key={r.restaurantId} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{r.name}</p>
                        <p className="text-[10px] text-gray-400">{r.bankName} • {r.accountNumber}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-700">{r.orderCount}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">₹{r.grossAmount}</td>
                      <td className="px-6 py-4">
                        {r.commissionRate !== null ? (
                          <div>
                            <span className="font-bold text-rose-600">-₹{r.commissionAmount}</span>{' '}
                            <span className="text-[10px] font-bold text-gray-500">({r.commissionRate}%)</span>
                            <span className="block text-[9px] font-black text-emerald-600 uppercase">CONFIGURED</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-gray-400">₹0.00</span>
                            <span className="block text-[9px] font-black text-amber-600 uppercase">UNCONFIGURED (0%)</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 text-sm">₹{r.netPayable}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            r.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleSettleRestaurant(r.restaurantId)}
                          disabled={settlingId === r.restaurantId || r.netPayable <= 0}
                          className="rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-40 transition"
                        >
                          {settlingId === r.restaurantId ? 'Processing...' : 'Settle Payout'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RIDER SETTLEMENTS */}
      {activeTab === 'RIDERS' && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Courier Partner</th>
                  <th className="px-6 py-4">Vehicle &amp; License</th>
                  <th className="px-6 py-4">Completed Deliveries</th>
                  <th className="px-6 py-4">Gross Earned</th>
                  <th className="px-6 py-4">Pending Balance</th>
                  <th className="px-6 py-4">Settlement Account</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading courier ledger...</td>
                  </tr>
                ) : (data?.riderSettlements || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No delivery couriers registered.</td>
                  </tr>
                ) : (
                  data?.riderSettlements.map((d) => (
                    <tr key={d.driverId} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {d.name}
                        <span className="block text-[10px] font-normal text-gray-400">{d.phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-700">{d.vehicleType}</span>
                        <span className="block text-[10px] text-gray-400">{d.licenseNumber}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-700">{d.completedDeliveries}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">₹{d.grossEarnings}</td>
                      <td className="px-6 py-4 font-black text-emerald-600 text-sm">₹{d.pendingSettlement}</td>
                      <td className="px-6 py-4 text-gray-500">{d.bankDetails}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            d.status === 'SETTLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM REVENUE AUDIT */}
      {activeTab === 'PLATFORM_REVENUE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900">Revenue Component Breakdown</h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-gray-600">Restaurant Commission (15%)</span>
                <span className="font-black text-gray-900">₹{summary.totalCommissionRevenue}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-600">Platform Convenience Fees (₹3 / Order)</span>
                <span className="font-black text-gray-900">₹{summary.totalPlatformFees}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-600">Customer Delivery Fees (₹15 / Order)</span>
                <span className="font-black text-gray-900">₹{summary.totalDeliveryFees}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-600">GST Collected on Services</span>
                <span className="font-black text-gray-900">₹0</span>
              </div>
              <div className="flex justify-between py-3 font-black text-sm text-emerald-600 border-t border-gray-200">
                <span>Total FoodHub Yield</span>
                <span>₹{summary.netPlatformRevenue}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900">Statutory &amp; Regulatory Compliance</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Section 9(5) E-Commerce Operator Compliance: Remitted at Source</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero Hidden GST or Customer Packaging Markups Enforced</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Small Order Surcharges Disabled Authoritatively</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>All settlements recorded in immutable PostgreSQL transaction logs</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
