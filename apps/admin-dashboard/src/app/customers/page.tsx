'use client';

import React, { useState } from 'react';
import { Users, ShieldAlert, CheckCircle2, Search } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([
    { id: 'c1', name: 'Rahul Sharma', phone: '+919876543210', email: 'rahul.sharma@example.com', orders: 14, wallet: 100, active: true },
    { id: 'c2', name: 'Priya Patel', phone: '+919876543211', email: 'priya.patel@example.com', orders: 8, wallet: 50, active: true },
    { id: 'c3', name: 'Anish Verma', phone: '+919876543212', email: 'anish.v@example.com', orders: 5, wallet: 0, active: false },
  ]);

  const toggleStatus = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Customer Directory ({customers.length})</h1>
          <p className="text-xs text-gray-500">Manage registered customer accounts, wallet balances & access status</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4">Total Orders</th>
              <th className="px-6 py-4">Wallet Balance</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                <td className="px-6 py-4">
                  <p className="text-gray-900 font-medium">{c.phone}</p>
                  <p className="text-[10px] text-gray-400">{c.email}</p>
                </td>
                <td className="px-6 py-4 font-black text-gray-900">{c.orders} Orders</td>
                <td className="px-6 py-4 font-black text-emerald-600">₹{c.wallet}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black ${
                      c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.active ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatus(c.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      c.active
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {c.active ? 'Suspend Account' : 'Activate Account'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
