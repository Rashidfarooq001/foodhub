'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Ban,
  Percent,
  FileText,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@foodhub/config';

interface Restaurant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  deliveryMode?: 'FOODHUB_DELIVERY' | 'RESTAURANT_SELF_DELIVERY';
  deliveryRadius?: number;
  commissionRate?: number;
  avgRating?: number;
  createdAt?: string;
  owner?: {
    profile?: {
      firstName?: string;
      lastName?: string;
    };
    phone?: string;
  };
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Multi-select Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Reason & Confirmation Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE' | 'COMMISSION';
    restaurantId?: string;
    restaurantName?: string;
    isBulk?: boolean;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [modalCommission, setModalCommission] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const res = await adminFetch('/restaurants?admin=true');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.restaurants) ? data.restaurants : []);
        setRestaurants(list);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();

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

      socket.on('restaurant.status_changed', (payload: { restaurantId: string; status: any; isOpen: boolean }) => {
        if (payload?.restaurantId) {
          setRestaurants((prev) =>
            prev.map((r) =>
              r.id === payload.restaurantId ? { ...r, status: payload.status } : r,
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
  }, []);

  const executeStatusChange = async (
    id: string,
    nextStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING_APPROVAL',
    reason?: string,
  ) => {
    try {
      const res = await adminFetch(`/restaurants/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus === 'PENDING_APPROVAL' ? 'PENDING' : nextStatus, rejectionReason: reason }),
      });
      if (res.ok) {
        if (nextStatus === 'REJECTED') {
          setRestaurants((prev) => prev.filter((r) => r.id !== id));
        } else {
          setRestaurants((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)),
          );
        }
        return { success: true, id };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, id, error: err.message || 'Operation failed' };
    } catch (err: any) {
      return { success: false, id, error: err.message || 'Network error' };
    }
  };

  const handleConfirmModal = async () => {
    if (!activeModal) return;
    setIsProcessing(true);

    if (activeModal.type === 'COMMISSION' && activeModal.restaurantId) {
      try {
        const rate = modalCommission === '' ? null : Number(modalCommission);
        const res = await adminFetch(`/restaurants/${activeModal.restaurantId}/commission`, {
          method: 'PATCH',
          body: JSON.stringify({ commissionRate: rate }),
        });
        if (res.ok) {
          setRestaurants((prev) =>
            prev.map((r) =>
              r.id === activeModal.restaurantId ? { ...r, commissionRate: rate ?? undefined } : r,
            ),
          );
        }
      } catch {
        /* error */
      }
      setIsProcessing(false);
      setActiveModal(null);
      return;
    }

    if (activeModal.isBulk) {
      // BULK EXECUTION
      const targetStatus: 'APPROVED' | 'SUSPENDED' | 'REJECTED' =
        activeModal.type === 'APPROVE' || activeModal.type === 'REACTIVATE'
          ? 'APPROVED'
          : activeModal.type === 'SUSPEND'
          ? 'SUSPENDED'
          : 'REJECTED';

      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        const result = await executeStatusChange(id, targetStatus, modalReason);
        if (result.success) successCount++;
        else failCount++;
      }

      setBulkResults({
        message: `Bulk Action: ${successCount} updated successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
        type: failCount === 0 ? 'success' : 'info',
      });

      setSelectedIds([]);
      setIsProcessing(false);
      setActiveModal(null);
      setModalReason('');
      fetchRestaurants();
      return;
    }

    // SINGLE RECORD EXECUTION
    if (activeModal.restaurantId) {
      const targetStatus: 'APPROVED' | 'SUSPENDED' | 'REJECTED' =
        activeModal.type === 'APPROVE' || activeModal.type === 'REACTIVATE'
          ? 'APPROVED'
          : activeModal.type === 'SUSPEND'
          ? 'SUSPENDED'
          : 'REJECTED';

      await executeStatusChange(activeModal.restaurantId, targetStatus, modalReason);
      setIsProcessing(false);
      setActiveModal(null);
      setModalReason('');
      fetchRestaurants();
    }
  };

  const handleUpdateRadius = async (id: string, deliveryRadius: number) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deliveryRadius } : r)),
    );

    try {
      await adminFetch(`/restaurants/${id}/delivery-radius`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryRadius }),
      });
    } catch {
      fetchRestaurants();
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filtered = Array.isArray(restaurants)
    ? restaurants.filter((r) => {
        if (!r) return false;
        const matchesSearch =
          (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.phone || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === 'ALL' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Restaurant Lifecycle Management {isLoading ? '' : `(${restaurants.length})`}
          </h1>
          <p className="text-xs text-gray-500">
            Authoritative merchant approval, suspension, commission &amp; audit lifecycle controls
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurant or phone..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <Link
            href="/restaurants/approval"
            className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 min-h-[40px]"
          >
            <Plus className="h-4 w-4 shrink-0" /> Pending Applications
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {['ALL', 'APPROVED', 'PENDING_APPROVAL', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                statusFilter === st
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st === 'ALL' ? 'All Stores' : st.replace('_', ' ')}
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
                  type: 'APPROVE',
                  isBulk: true,
                })
              }
              className="rounded-xl bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 transition"
            >
              Bulk Approve
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

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
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
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Owner / Contact</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Delivery Radius</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading restaurants...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No restaurants match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50/50 ${isSelected ? 'bg-purple-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{r.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {r.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {r.owner?.profile?.firstName
                          ? `${r.owner.profile.firstName} ${r.owner.profile.lastName || ''}`
                          : 'Merchant Owner'}
                        <span className="text-gray-400 block text-[11px]">{r.phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setModalCommission(r.commissionRate ?? '');
                            setActiveModal({
                              type: 'COMMISSION',
                              restaurantId: r.id,
                              restaurantName: r.name,
                            });
                          }}
                          className="flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-800 transition"
                        >
                          <Percent className="h-3 w-3 text-purple-600" />
                          {r.commissionRate !== null && r.commissionRate !== undefined
                            ? `${r.commissionRate}%`
                            : 'Global'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={r.deliveryRadius || 15}
                          onChange={(e) => handleUpdateRadius(r.id, parseFloat(e.target.value))}
                          className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                        >
                          <option value={5}>5 km</option>
                          <option value={10}>10 km</option>
                          <option value={15}>15 km (Default)</option>
                          <option value={20}>20 km</option>
                          <option value={25}>25 km</option>
                          <option value={30}>30 km</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* State-Aware Action Controls */}
                          {r.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() =>
                                  setActiveModal({
                                    type: 'APPROVE',
                                    restaurantId: r.id,
                                    restaurantName: r.name,
                                  })
                                }
                                className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setActiveModal({
                                    type: 'REJECT',
                                    restaurantId: r.id,
                                    restaurantName: r.name,
                                  })
                                }
                                className="rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {r.status === 'APPROVED' && (
                            <button
                              onClick={() =>
                                setActiveModal({
                                  type: 'SUSPEND',
                                  restaurantId: r.id,
                                  restaurantName: r.name,
                                })
                              }
                              className="rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Suspend
                            </button>
                          )}

                          {r.status === 'SUSPENDED' && (
                            <button
                              onClick={() =>
                                setActiveModal({
                                  type: 'REACTIVATE',
                                  restaurantId: r.id,
                                  restaurantName: r.name,
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
              {activeModal.type === 'APPROVE' || activeModal.type === 'REACTIVATE' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : activeModal.type === 'COMMISSION' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 font-bold">
                  <Percent className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              )}

              <div>
                <h3 className="text-base font-black text-gray-900">
                  {activeModal.isBulk
                    ? `Bulk ${activeModal.type} (${selectedIds.length} Stores)`
                    : activeModal.type === 'COMMISSION'
                    ? `Set Commission: ${activeModal.restaurantName}`
                    : `${activeModal.type} Restaurant: ${activeModal.restaurantName}`}
                </h3>
                <p className="text-xs text-gray-500">
                  {activeModal.type === 'COMMISSION'
                    ? 'Configure custom restaurant commission rate'
                    : 'Action will be logged to the platform Audit Log with timestamp and admin identity.'}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            {activeModal.type === 'COMMISSION' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Commission Rate (%)</label>
                <input
                  type="number"
                  placeholder="Leave empty for global platform rate"
                  value={modalCommission}
                  onChange={(e) => setModalCommission(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">
                  {activeModal.type === 'REJECT' || activeModal.type === 'SUSPEND'
                    ? 'Reason for Action (Required)'
                    : 'Notes / Reason (Optional)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    activeModal.type === 'REJECT' || activeModal.type === 'SUSPEND'
                      ? 'Specify reason for suspension or rejection...'
                      : 'Add optional administrative notes...'
                  }
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setModalReason('');
                  setModalCommission('');
                }}
                disabled={isProcessing}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                disabled={
                  isProcessing ||
                  ((activeModal.type === 'REJECT' || activeModal.type === 'SUSPEND') &&
                    !modalReason.trim())
                }
                className={`rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-md transition disabled:opacity-50 ${
                  activeModal.type === 'APPROVE' || activeModal.type === 'REACTIVATE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : activeModal.type === 'COMMISSION'
                    ? 'bg-purple-600 hover:bg-purple-700'
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
