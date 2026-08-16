'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare, CheckCircle, Clock, AlertTriangle, Search, Filter,
  Send, RefreshCw, User, ShieldCheck, ChevronRight
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    phone: string;
    email: string | null;
    role: string;
    name: string;
  };
  messagesCount: number;
  lastMessage: string | null;
}

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const url = filterStatus === 'ALL'
        ? '/support-tickets'
        : `/support-tickets?status=${filterStatus}`;
      const res = await adminFetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const loadTicketDetails = async (id: string) => {
    try {
      const res = await adminFetch(`/support-tickets/${id}`);
      if (res.ok) {
        const fullTicket = await res.json();
        setSelectedTicket(fullTicket);
      }
    } catch {
      /* offline */
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await adminFetch(`/support-tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTickets();
        if (selectedTicket?.id === id) {
          setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch {
      /* offline */
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await adminFetch(`/support-tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText('');
        loadTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch {
      /* offline */
    } finally {
      setIsSendingReply(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      (t.ticketNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user.phone || '').includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Support Ticket Center</h1>
          <p className="text-xs text-gray-500">Live dispute resolution, order inquiries &amp; partner communications</p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, subject, user, phone..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tickets List */}
        <div className={`space-y-3 ${selectedTicket ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading support tickets...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No support tickets found in PostgreSQL database.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => loadTicketDetails(t.id)}
                        className={`cursor-pointer hover:bg-gray-50/70 transition ${
                          selectedTicket?.id === t.id ? 'bg-purple-50/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-black text-gray-900 block">{t.ticketNo}</span>
                          <span className="text-gray-600 font-medium truncate block max-w-[200px]">{t.subject}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{t.user.name}</p>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-black text-gray-600">
                            {t.user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              t.priority === 'URGENT' || t.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : t.priority === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                              t.status === 'OPEN'
                                ? 'bg-rose-100 text-rose-800'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="inline-block h-4 w-4 text-gray-400" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Ticket Conversation Thread */}
        {selectedTicket && (
          <div className="lg:col-span-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {selectedTicket.ticketNo} — {selectedTicket.subject}
                </h3>
                <p className="text-xs text-gray-500">
                  Created by {selectedTicket.user?.profile?.firstName || 'User'} ({selectedTicket.user?.phone})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-800 focus:border-purple-600 focus:outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(selectedTicket.messages || []).map((m: any) => {
                const isAdmin = m.senderId !== selectedTicket.userId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs ${
                        isAdmin
                          ? 'bg-purple-600 text-white rounded-br-none shadow-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="font-medium">{m.message}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="border-t border-gray-100 pt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Type response to ticket creator..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none"
              />
              <button
                onClick={handleSendReply}
                disabled={isSendingReply || !replyText.trim()}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-40 transition flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
