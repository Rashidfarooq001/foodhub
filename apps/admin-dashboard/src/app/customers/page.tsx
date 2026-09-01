'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  Ban,
  Phone,
  ShoppingBag,
  MapPin,
  X,
  Trash2,
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@foodhub/config';

interface CustomerRecord {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  addressCount: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'SUSPEND' | 'REACTIVATE' | 'DELETE';
    userId: string;
    customerName: string;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const q = encodeURIComponent(search);
      const res = await adminFetch(`/users/customers?limit=50&search=${q}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    try {
      const apiBase = getApiBaseUrl();
      const socketUrl = apiBase.replace('/api/v1', '');
      const socket = io(`${socketUrl}/orders`, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('joinAdmin');
      });

      socket.on('user.status_changed', (payload: { userId: string; isActive: boolean }) => {
        if (payload?.userId) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.userId === payload.userId ? { ...c, isActive: payload.isActive } : c,
            ),
          );
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      /* noop */
    }
  }, [search]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    setIsProcessing(true);
    setActionError(null);

    try {
      let res;
      if (activeModal.type === 'DELETE') {
        res = await adminFetch(`/users/customers/${activeModal.userId}`, {
          method: 'DELETE',
        });
      } else {
        const newStatus = activeModal.type === 'REACTIVATE';
        res = await adminFetch(`/users/customers/${activeModal.userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: newStatus, reason: modalReason }),
        });
      }

      if (res.ok) {
        setActiveModal(null);
        setModalReason('');
        await fetchCustomers();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.message || 'Failed to update customer status');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (statusFilter === 'ACTIVE') return c.isActive;
    if (statusFilter === 'SUSPENDED') return !c.isActive;
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Registered food consumers, lifetime orders &amp; account statuses
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[40px] ${
                statusFilter === st
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List (Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Customers ({filtered.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">
            Loading customer directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No customers found matching search.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <h3 className="font-black text-sm text-gray-900">{c.name || 'Customer'}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">{c.phone || c.email}</p>
                    </div>

                    <span
                      className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                        c.isActive
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">
                        Orders Placed
                      </span>
                      <span className="font-bold text-gray-900">{c.totalOrders} Orders</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">
                        Total Spent
                      </span>
                      <span className="font-black text-purple-700">
                        ₹{c.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex gap-2">
                    {c.isActive ? (
                      <button
                        onClick={() =>
                          setActiveModal({
                            type: 'SUSPEND',
                            userId: c.userId,
                            customerName: c.name,
                          })
                        }
                        className="flex-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 text-xs font-bold min-h-[40px]"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setActiveModal({
                            type: 'REACTIVATE',
                            userId: c.userId,
                            customerName: c.name,
                          })
                        }
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-black text-white min-h-[40px]"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setActiveModal({ type: 'DELETE', userId: c.userId, customerName: c.name })
                      }
                      className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-black text-white min-h-[40px]"
                    >
                      Delete
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
                    <th className="pb-3">Customer Name</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Orders</th>
                    <th className="pb-3">Total Spent</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">{c.name || 'Customer'}</td>
                      <td className="py-3 text-gray-600">{c.phone}</td>
                      <td className="py-3 text-gray-500">{c.email || '-'}</td>
                      <td className="py-3 font-bold text-gray-800">{c.totalOrders}</td>
                      <td className="py-3 font-black text-purple-700">
                        ₹{c.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        {c.isActive ? (
                          <button
                            onClick={() =>
                              setActiveModal({
                                type: 'SUSPEND',
                                userId: c.userId,
                                customerName: c.name,
                              })
                            }
                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setActiveModal({
                                type: 'REACTIVATE',
                                userId: c.userId,
                                customerName: c.name,
                              })
                            }
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setActiveModal({
                              type: 'DELETE',
                              userId: c.userId,
                              customerName: c.name,
                            })
                          }
                          className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black text-white hover:bg-rose-700 inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
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

      {/* Action Bottom Sheet / Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-gray-900">
                {activeModal.type === 'SUSPEND' && `Suspend ${activeModal.customerName}`}
                {activeModal.type === 'REACTIVATE' && `Reactivate ${activeModal.customerName}`}
                {activeModal.type === 'DELETE' && `Permanently Delete ${activeModal.customerName}`}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleExecuteAction} className="space-y-4">
              {activeModal.type === 'DELETE' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                  <p className="font-bold">WARNING</p>
                  <p className="text-[11px] text-rose-600">
                    This action cannot be undone. The customer's account and active operational data
                    will be permanently removed from the platform.
                  </p>
                </div>
              )}

              {activeModal.type === 'SUSPEND' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Reason for Suspension
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide reason for consumer suspension (policy violation, fraudulent claims, etc.)..."
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`flex-1 rounded-2xl py-3 text-xs font-black text-white shadow-md transition min-h-[44px] ${
                    activeModal.type === 'DELETE'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  }`}
                >
                  {isProcessing
                    ? 'Processing...'
                    : activeModal.type === 'DELETE'
                      ? 'DELETE PERMANENTLY'
                      : 'Confirm Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
