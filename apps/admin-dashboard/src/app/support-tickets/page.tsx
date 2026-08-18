'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Send,
  RefreshCw,
  User,
  ShieldCheck,
  X,
  ChevronRight,
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
      const url = filterStatus === 'ALL' ? '/support-tickets' : `/support-tickets?status=${filterStatus}`;
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Support Ticket Center
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Live dispute resolution, order inquiries &amp; multi-stakeholder partner messaging
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, subject, customer or driver..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-2xl px-3.5 py-2 text-xs font-black transition whitespace-nowrap min-h-[40px] ${
                filterStatus === st
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List (Dual Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Tickets ({filtered.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading support tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No support tickets found matching filter.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetails(t.id)}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3 cursor-pointer hover:border-purple-300 transition"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <span className="text-xs font-black text-purple-700">{t.ticketNo}</span>
                      <h3 className="font-bold text-sm text-gray-900 mt-0.5">{t.subject}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase ${getStatusBadge(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase border ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-bold text-gray-900">{t.user.name}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-black text-gray-500 uppercase">
                        {t.user.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-purple-600 font-bold">
                      {t.messagesCount} message(s)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadTicketDetails(t.id);
                      }}
                      className="flex items-center gap-1 text-xs font-black text-purple-700 hover:underline min-h-[36px]"
                    >
                      <span>Open Thread</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Ticket</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => loadTicketDetails(t.id)}
                      className="hover:bg-gray-50/50 cursor-pointer"
                    >
                      <td className="py-3">
                        <span className="font-black text-gray-900 block">{t.ticketNo}</span>
                        <span className="text-gray-600 truncate block max-w-xs">{t.subject}</span>
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-gray-900">{t.user.name}</p>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-black text-gray-600 uppercase">
                          {t.user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase ${getStatusBadge(t.status)}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadTicketDetails(t.id);
                          }}
                          className="rounded-lg border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-50"
                        >
                          View Thread
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Ticket Details Drawer / Bottom Sheet */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sticky top-0 bg-white z-10">
              <div>
                <span className="text-xs font-black text-purple-600">{selectedTicket.ticketNo}</span>
                <h3 className="text-base font-black text-gray-900">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Selector */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl text-xs">
              <span className="font-bold text-gray-700">Update Ticket Status:</span>
              <div className="flex gap-1">
                {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                    className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase transition min-h-[32px] ${
                      selectedTicket.status === st
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread Messages */}
            <div className="space-y-3 max-h-64 overflow-y-auto p-2 bg-gray-50/50 rounded-2xl border border-gray-100">
              {selectedTicket.messages?.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">No conversation history.</div>
              ) : (
                selectedTicket.messages?.map((m: any, idx: number) => {
                  const isAdmin = m.senderRole === 'SUPER_ADMIN' || m.senderRole === 'ADMIN';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                          isAdmin
                            ? 'bg-purple-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        <p className="font-bold text-[10px] opacity-80 mb-0.5">
                          {m.senderName || (isAdmin ? 'Platform Support' : selectedTicket.user.name)}
                        </p>
                        <p className="font-medium whitespace-pre-wrap">{m.message}</p>
                      </div>
                      <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Type response to partner..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
              />
              <button
                onClick={handleSendReply}
                disabled={isSendingReply || !replyText.trim()}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 px-5 py-3 text-xs font-black text-white shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 min-h-[44px] shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
