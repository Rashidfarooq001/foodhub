'use client';

import React from 'react';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

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
  const [customerWallets, setCustomerWallets] = React.useState<CustomerWalletItem[]>([]);
  const [driverWallets, setDriverWallets] = React.useState<DriverWalletItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchWallets = async () => {
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
    fetchWallets();
  }, []);
  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Platform Wallets Overview</h1>
        <p className="text-xs text-gray-500">Customer cashback wallets & driver earning wallets</p>
      </div>

      {/* Customer Wallets */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-600" /> Customer Wallets
        </h2>
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Total Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerWallets.map((c) => (
                <tr key={c.phone} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-gray-500">{c.phone}</td>
                  <td className="px-6 py-4 font-black text-emerald-600 text-sm">₹{c.balance}</td>
                  <td className="px-6 py-4 text-gray-700">{c.txCount} transactions</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Wallets */}
      <div>
        <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" /> Driver Earning Wallets
        </h2>
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Total Deliveries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {driverWallets.map((d) => (
                <tr key={d.vehicle} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 font-black text-purple-600">{d.vehicle}</td>
                  <td className="px-6 py-4 font-black text-blue-600 text-sm">₹{d.balance.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-gray-700">{d.txCount} deliveries</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
