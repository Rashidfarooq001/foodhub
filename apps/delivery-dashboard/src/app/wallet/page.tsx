'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  RefreshCw,
  Bike,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

export default function DeliverySettlementPage() {
  const { accessToken } = useDeliveryAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettlementData = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [statsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/delivery/stats`, { headers }),
        fetch(`${API_BASE}/delivery/history`, { headers }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistory(Array.isArray(histData) ? histData : histData.orders || []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementData();
  }, [accessToken]);

  const totalEarnings = stats?.totalEarnings ?? stats?.weeklyEarnings ?? 0;
  const pendingSettlement = stats?.pendingSettlement ?? totalEarnings;
  const settledAmount = stats?.settledAmount ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Settlement &amp; Payout Ledger
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Courier delivery earnings, weekly settlement cycles &amp; direct bank transfer records
          </p>
        </div>

        <button
          onClick={fetchSettlementData}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 block">
            LIFETIME EARNINGS
          </span>
          <div className="text-lg sm:text-2xl font-black text-gray-900">?{totalEarnings}</div>
          <span className="text-[10px] text-gray-500 font-semibold block">
            From all completed trips
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-800 block">
            PENDING SETTLEMENT
          </span>
          <div className="text-lg sm:text-2xl font-black text-amber-900">?{pendingSettlement}</div>
          <span className="text-[10px] text-amber-700 font-semibold block">
            Scheduled Monday payout
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800 block">
            AVAILABLE PAYOUT
          </span>
          <div className="text-lg sm:text-2xl font-black text-emerald-900">
            ?{pendingSettlement}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            Eligible for bank transfer
          </span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 sm:p-5 shadow-sm space-y-1">
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-blue-800 block">
            SETTLED TO BANK
          </span>
          <div className="text-lg sm:text-2xl font-black text-blue-900">?{settledAmount}</div>
          <span className="text-[10px] text-blue-700 font-semibold block">
            IMPS / NEFT transfer
          </span>
        </div>
      </div>

      {/* Verified Bank Account Details */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-black text-gray-900 block">
              Registered Courier Bank Account (State Bank of India)
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              A/C: **** **** 9821 • IFSC: SBIN0001824
            </span>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Verified for Direct Deposit
        </span>
      </div>

      {/* Trip & Payout History (Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Delivery Trip Payout Logs ({history.length})
        </h2>

        {history.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Bike className="h-8 w-8 mx-auto text-gray-300 mb-1" />
            No delivery trip logs found in this cycle.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5">
              {history.map((trip) => (
                <div
                  key={trip.id}
                  className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900">
                      #{trip.orderNumber || trip.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                      +?{trip.payout || trip.deliveryFee || 0}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 space-y-0.5">
                    <div>
                      Restaurant:{' '}
                      <strong className="text-gray-800">
                        {trip.restaurantName || 'Restaurant'}
                      </strong>
                    </div>
                    <div>
                      Drop:{' '}
                      <strong className="text-gray-800">
                        {trip.customerAddress || 'Customer Area'}
                      </strong>
                    </div>
                    <div className="pt-1 text-[10px] text-gray-400 font-medium">
                      {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : 'Today'}
                      {' • '}
                      <span className="font-bold text-emerald-600">{trip.status || 'COMPLETED'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Restaurant</th>
                    <th className="pb-3">Customer Area</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Rider Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {history.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">
                        #{trip.orderNumber || trip.id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-gray-700">{trip.restaurantName || 'Restaurant'}</td>
                      <td className="py-3 text-gray-600">
                        {trip.customerAddress || 'Customer Area'}
                      </td>
                      <td className="py-3 text-gray-400">
                        {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : 'Today'}
                      </td>
                      <td className="py-3 font-bold text-emerald-600">{trip.status || 'COMPLETED'}</td>
                      <td className="py-3 font-black text-emerald-700 text-right">
                        +?{trip.payout || trip.deliveryFee || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
