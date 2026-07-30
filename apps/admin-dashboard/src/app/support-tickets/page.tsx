'use client';

import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: 'ORDER' | 'PAYMENT' | 'DELIVERY' | 'RESTAURANT';
  userName: string;
  userRole: 'CUSTOMER' | 'RESTAURANT' | 'DRIVER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-9481',
      subject: 'Order delayed by 25 mins',
      category: 'DELIVERY',
      userName: 'Rahul Sharma',
      userRole: 'CUSTOMER',
      status: 'OPEN',
      priority: 'HIGH',
      createdAt: '10 mins ago',
    },
    {
      id: 'TCK-9478',
      subject: 'Refund status inquiry for Order #8812',
      category: 'PAYMENT',
      userName: 'Spice Garden',
      userRole: 'RESTAURANT',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdAt: '1 hour ago',
    },
    {
      id: 'TCK-9450',
      subject: 'Driver wallet withdrawal delay',
      category: 'PAYMENT',
      userName: 'Vikram Singh',
      userRole: 'DRIVER',
      status: 'RESOLVED',
      priority: 'LOW',
      createdAt: 'Yesterday',
    },
  ]);

  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const updateStatus = (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
  };

  const filtered = tickets.filter((t) => (filter === 'ALL' ? true : t.status === filter));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Support Ticket Management</h1>
        <p className="text-xs text-gray-500">View & resolve customer, merchant, and driver support requests</p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filter === st
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Subject & User</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-black text-gray-900">{t.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{t.subject}</p>
                    <p className="text-[10px] text-gray-400">
                      {t.userName} ({t.userRole}) • {t.createdAt}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                        t.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : t.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {t.status === 'RESOLVED' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : t.status === 'IN_PROGRESS' ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      <span>{t.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    {t.status !== 'RESOLVED' && (
                      <button
                        onClick={() => updateStatus(t.id, 'RESOLVED')}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
