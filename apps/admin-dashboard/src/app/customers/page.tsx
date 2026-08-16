'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Ban,
  RotateCcw,
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
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-select Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Reason & Confirmation Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'SUSPEND' | 'REACTIVATE';
    userId?: string;
    customerName?: string;
    isBulk?: boolean;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCustomers = async (currentPage = page, searchQuery = search) => {
    setIsLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(searchQuery);
      const res = await adminFetch(`/users/customers?page=${currentPage}&limit=50&search=${q}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch customers: ${res.statusText}`);
      }
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer directory');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, search);

    // Socket.IO Real-time synchronization
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
      /* socket error */
    }
  }, [search]);

  const executeCustomerStatusChange = async (userId: string, isActive: boolean, reason?: string) => {
    try {
      const res = await adminFetch(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive, reason }),
      });
      if (res.ok) {
        return { success: true, userId };
      }
      return { success: false, userId };
    } catch {
      return { success: false, userId };
    }
  };

  const handleConfirmModal = async () => {
    if (!activeModal) return;
    setIsProcessing(true);

    const isActivation = activeModal.type === 'REACTIVATE';

    if (activeModal.isBulk) {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        const res = await executeCustomerStatusChange(id, isActivation, modalReason);
        if (res.success) successCount++;
        else failCount++;
      }

      setBulkResults({
        message: `Bulk Action: ${successCount} accounts updated successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
        type: failCount === 0 ? 'success' : 'info',
      });

      setSelectedIds([]);
      setIsProcessing(false);
      setActiveModal(null);
      setModalReason('');
      fetchCustomers(page, search);
      return;
    }

    if (activeModal.userId) {
      await executeCustomerStatusChange(activeModal.userId, isActivation, modalReason);
      setIsProcessing(false);
      setActiveModal(null);
      setModalReason('');
      fetchCustomers(page, search);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((c) => c.userId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((i) => i !== userId) : [...prev, userId],
    );
  };

  const filtered = customers.filter((c) => {
    if (statusFilter === 'ACTIVE') return c.isActive;
    if (statusFilter === 'SUSPENDED') return !c.isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Customer Directory ({totalCount})
          </h1>
          <p className="text-xs text-gray-500">
            Live registered customer accounts, lifetime spending metrics &amp; suspension controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, phone, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 text-xs rounded-2xl border border-gray-200 bg-white focus:outline-none focus:border-purple-600 w-64 shadow-sm"
            />
          </div>

          <button
            onClick={() => fetchCustomers(page, search)}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                statusFilter === st
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st === 'ALL' ? 'All Customers' : st}
            </button>
          ))}
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-2 text-xs">
            <span className="font-bold text-purple-900">{selectedIds.length} Selected</span>
            <button
              onClick={() =>
                setActiveModal({
                  type: 'REACTIVATE',
                  isBulk: true,
                })
              }
              className="rounded-xl bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 transition"
            >
              Bulk Activate
            </button>
            <button
              onClick={() =>
                setActiveModal({
                  type: 'SUSPEND',
                  isBulk: true,
                })
              }
              className="rounded-xl bg-rose-600 px-3 py-1 text-white font-bold hover:bg-rose-700 transition"
            >
              Bulk Suspend
            </button>
          </div>
        )}
      </div>

      {/* Bulk Result Banner */}
      {bulkResults && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
            bulkResults.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <span>{bulkResults.message}</span>
          <button onClick={() => setBulkResults(null)} className="text-gray-500 hover:text-gray-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleSelectAll}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Phone / Contact</th>
                <th className="px-6 py-4">Orders (Done / Cancelled)</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No customers match the search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isSelected = selectedIds.includes(c.userId);
                  return (
                    <tr key={c.userId} className={`hover:bg-gray-50/50 ${isSelected ? 'bg-purple-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.userId)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{c.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Joined: {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800 block">{c.phone}</span>
                        <span className="text-[11px] text-gray-400">{c.email || 'No email linked'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">
                          {c.totalOrders} total orders
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          {c.completedOrders} completed
                        </span>
                        {c.cancelledOrders > 0 && (
                          <span className="text-[10px] text-rose-500 font-bold ml-1">
                            • {c.cancelledOrders} cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">
                        ₹{c.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.isActive ? (
                            <button
                              onClick={() =>
                                setActiveModal({
                                  type: 'SUSPEND',
                                  userId: c.userId,
                                  customerName: c.name,
                                })
                              }
                              className="rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
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
                              className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Reason Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
              {activeModal.type === 'REACTIVATE' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              )}

              <div>
                <h3 className="text-base font-black text-gray-900">
                  {activeModal.isBulk
                    ? `Bulk ${activeModal.type} (${selectedIds.length} Customers)`
                    : `${activeModal.type} Customer: ${activeModal.customerName}`}
                </h3>
                <p className="text-xs text-gray-500">
                  Suspension stops customer login/orders while preserving historical records.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">
                {activeModal.type === 'SUSPEND' ? 'Reason for Account Suspension (Required)' : 'Notes (Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  activeModal.type === 'SUSPEND'
                    ? 'Specify reason for customer account suspension...'
                    : 'Add optional administrative notes...'
                }
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setModalReason('');
                }}
                disabled={isProcessing}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                disabled={isProcessing || (activeModal.type === 'SUSPEND' && !modalReason.trim())}
                className={`rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-md transition disabled:opacity-50 ${
                  activeModal.type === 'REACTIVATE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
