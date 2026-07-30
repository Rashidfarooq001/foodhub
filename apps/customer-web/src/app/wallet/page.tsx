'use client';

import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, ShieldCheck, X } from 'lucide-react';
import { useCartStore } from '../../stores/use-cart-store';

export default function WalletPage() {
  const { walletBalance } = useCartStore();

  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('500');

  const transactions = [
    {
      id: 'tx-1',
      type: 'CREDIT',
      amount: 100,
      description: 'Cashback reward for order #FH-819201',
      date: '24 July 2026',
    },
    {
      id: 'tx-2',
      type: 'DEBIT',
      amount: 50,
      description: 'Applied on order #FH-718293',
      date: '18 July 2026',
    },
    {
      id: 'tx-3',
      type: 'CREDIT',
      amount: 200,
      description: 'Added via UPI GPay',
      date: '10 July 2026',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">FoodHub Wallet</h1>
        <p className="text-xs text-gray-500">Manage in-app cashback rewards & instant checkout funds</p>
      </div>

      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Available Balance</p>
              <h2 className="text-4xl font-black">₹{walletBalance}</h2>
            </div>
          </div>

          <button
            onClick={() => setIsAddMoneyOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-emerald-800 shadow-xl transition hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" /> Add Money
          </button>
        </div>

        <div className="flex items-center gap-2 border-t border-white/20 pt-4 text-xs text-emerald-100">
          <ShieldCheck className="h-4 w-4 text-emerald-200" />
          <span>100% Instant refund guarantee on order cancellations</span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {tx.type === 'CREDIT' ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{tx.description}</h4>
                  <p className="text-[10px] text-gray-400">{tx.date}</p>
                </div>
              </div>

              <span
                className={`text-sm font-black ${
                  tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Money Modal */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Add Money to Wallet</h3>
              <button
                onClick={() => setIsAddMoneyOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">Enter Amount (₹)</label>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 p-4 text-center text-2xl font-black text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              {['200', '500', '1000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(amt)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-bold hover:border-emerald-500 hover:bg-emerald-50"
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                alert(`Added ₹${addAmount} to your wallet via Razorpay!`);
                setIsAddMoneyOpen(false);
              }}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700"
            >
              Proceed to Add Money
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
