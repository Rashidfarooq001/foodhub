'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, Plus, ShieldCheck, X } from 'lucide-react';
import { DriverStats } from '../../data/delivery-mock-data';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DeliveryWalletPage() {
  const [_driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [balance, setBalance] = useState(0);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState('1000');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/delivery/stats`);
        if (res.ok) {
          const data: DriverStats = await res.json();
          setDriverStats(data);
          setBalance(data.walletBalance ?? 0);
        }
      } catch { /* backend offline */ }
    };
    fetchStats();
  }, []);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (num > balance) {
      alert('Insufficient wallet balance!');
      return;
    }
    setBalance((prev: number) => prev - num);
    setWithdrawModalOpen(false);
    alert(`₹${num} transferred to your HDFC Bank account via IMPS!`);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Courier Wallet</h1>
        <p className="text-xs text-gray-500">Withdraw earned trip payouts instantly to your bank account</p>
      </div>

      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-600 p-8 text-white shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Available Balance</p>
              <h2 className="text-4xl font-black">₹{balance}</h2>
            </div>
          </div>

          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-emerald-800 shadow-xl transition hover:bg-emerald-50"
          >
            Request Instant Payout
          </button>
        </div>

        <div className="flex items-center gap-2 border-t border-white/20 pt-4 text-xs text-emerald-100">
          <ShieldCheck className="h-4 w-4 text-emerald-200" />
          <span>IMPS 24x7 Instant Bank Transfer (HDFC Bank **** 9821)</span>
        </div>
      </div>

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Instant Payout to Bank</h3>
              <button onClick={() => setWithdrawModalOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border-2 border-gray-200 p-4 text-center text-3xl font-black text-gray-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
              >
                Confirm & Transfer to Bank
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
