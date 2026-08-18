'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, RefreshCw, User, Bike, DollarSign } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface CustomerWalletItem {
  id: string;
  name: string;
  phone: string;
  balance: number;
  txCount: number;
}

interface DriverWalletItem {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  balance: number;
  txCount: number;
}

export default function AdminWalletsPage() {
  const [customerWallets, setCustomerWallets] = useState<CustomerWalletItem[]>([]);
  const [driverWallets, setDriverWallets] = useState<DriverWalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallets = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/wallet/overview');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.customerWallets)) {
          setCustomerWallets(data.customerWallets);
        }
        if (Array.isArray(data.driverWallets)) {
          setDriverWallets(data.driverWallets);
        }
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Platform Wallets &amp; Ledger
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Customer promotion cashback balances and courier settlement earning accounts
          </p>
        </div>

        <button
          onClick={fetchWallets}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SECTION 1: CUSTOMER CASHBACK WALLETS */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-purple-600" />
          <span>Customer Promotional Wallets ({customerWallets.length})</span>
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400">Loading customer wallets...</div>
        ) : customerWallets.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No active customer wallets found.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5">
              {customerWallets.map((c) => (
                <div
                  key={c.id || c.phone}
                  className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-black text-xs text-gray-900 block">{c.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{c.phone}</span>
                    <span className="text-[10px] text-gray-400 block">{c.txCount} transactions</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-700 block">₹{c.balance}</span>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Available</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Wallet Balance</th>
                    <th className="pb-3 text-right">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {customerWallets.map((c) => (
                    <tr key={c.id || c.phone} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3 text-gray-500 font-mono">{c.phone}</td>
                      <td className="py-3 font-black text-emerald-700">₹{c.balance}</td>
                      <td className="py-3 text-gray-600 text-right">{c.txCount} txs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* SECTION 2: COURIER SETTLEMENT LEDGERS */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
          <Bike className="h-4 w-4 text-teal-600" />
          <span>Courier Settlement Ledgers ({driverWallets.length})</span>
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400">Loading courier ledgers...</div>
        ) : driverWallets.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No courier settlement records found.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-2.5">
              {driverWallets.map((d) => (
                <div
                  key={d.id || d.phone}
                  className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-black text-xs text-gray-900 block">{d.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{d.phone} • {d.vehicle}</span>
                    <span className="text-[10px] text-gray-400 block">{d.txCount} trips completed</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-teal-700 block">₹{d.balance}</span>
                    <span className="text-[9px] font-bold text-teal-600 uppercase">Settled</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Courier Partner</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Total Earnings</th>
                    <th className="pb-3 text-right">Trips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {driverWallets.map((d) => (
                    <tr key={d.id || d.phone} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">{d.name}</td>
                      <td className="py-3 text-gray-500 font-mono">{d.phone}</td>
                      <td className="py-3 text-gray-700">{d.vehicle}</td>
                      <td className="py-3 font-black text-teal-700">₹{d.balance}</td>
                      <td className="py-3 text-gray-600 text-right">{d.txCount} trips</td>
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
