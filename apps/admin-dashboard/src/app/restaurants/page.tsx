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
  MapPin,
  RefreshCw,
  Store,
  X,
  Phone,
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
  deliveryMode?: string;
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

  // Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE' | 'COMMISSION';
    restaurantId: string;
    restaurantName: string;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [modalCommission, setModalCommission] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    setIsLoading(true);
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

    try {
      const apiBase = getApiBaseUrl();
      const socketUrl = apiBase.replace('/api/v1', '');
      const socket = io(`${socketUrl}/orders`, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('joinAdmin');
      });

      socket.on('restaurant.status_changed', (payload: { restaurantId: string; status: any }) => {
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
      /* noop */
    }
  }, []);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    setIsProcessing(true);
    setActionError(null);

    try {
      let res;
      if (activeModal.type === 'APPROVE') {
        res = await adminFetch(`/restaurants/${activeModal.restaurantId}/verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        });
      } else if (activeModal.type === 'REJECT') {
        if (!modalReason.trim()) {
          setActionError('A valid rejection reason is mandatory.');
          setIsProcessing(false);
          return;
        }
        res = await adminFetch(`/restaurants/${activeModal.restaurantId}/verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', rejectionReason: modalReason.trim() }),
        });
      } else if (activeModal.type === 'SUSPEND') {
        if (!modalReason.trim()) {
          setActionError('A suspension reason is mandatory.');
          setIsProcessing(false);
          return;
        }
        res = await adminFetch(`/restaurants/${activeModal.restaurantId}/verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SUSPENDED', rejectionReason: modalReason.trim() }),
        });
      } else if (activeModal.type === 'REACTIVATE') {
        res = await adminFetch(`/restaurants/${activeModal.restaurantId}/verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        });
      } else if (activeModal.type === 'COMMISSION') {
        res = await adminFetch(`/restaurants/${activeModal.restaurantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commissionRate: Number(modalCommission) }),
        });
      }

      if (res && res.ok) {
        setActiveModal(null);
        setModalReason('');
        setModalCommission('');
        await fetchRestaurants();
      } else {
        const err = await res?.json().catch(() => ({}));
        setActionError(err?.message || 'Failed to update restaurant');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 rounded-xl bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="flex items-center gap-1 rounded-xl bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
            <AlertTriangle className="h-3 w-3" />
            Pending Review
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="flex items-center gap-1 rounded-xl bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
            <Ban className="h-3 w-3" />
            Suspended
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 rounded-xl bg-gray-100 text-gray-700 px-2.5 py-0.5 text-[10px] font-black uppercase">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="rounded-xl bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-black uppercase">
            {status}
          </span>
        );
    }
  };

  const filtered = restaurants.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      (r.owner?.profile?.firstName && r.owner.profile.firstName.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Restaurant Partners Directory
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Lifecycle operations, commissioned take-rates &amp; store compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/restaurants/approval"
            className="flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Approval Queue</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by restaurant name, owner, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Horizontal Status Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'APPROVED', 'PENDING_APPROVAL', 'SUSPENDED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[40px] ${
                statusFilter === st
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st.replace(/_/g, ' ')} ({st === 'ALL' ? restaurants.length : restaurants.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant List (Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Stores ({filtered.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading restaurants...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No restaurants found matching filters.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <h3 className="font-black text-sm text-gray-900">{r.name}</h3>
                      <p className="text-[11px] text-gray-500 font-medium">{r.phone}</p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Owner</span>
                      <span className="font-bold text-gray-800">
                        {r.owner?.profile?.firstName ? `${r.owner.profile.firstName} ${r.owner.profile.lastName || ''}` : 'Partner'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-purple-700 font-bold uppercase block">Commission Rate</span>
                      <span className="font-black text-purple-900">{r.commissionRate ?? 15}%</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {r.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          onClick={() => setActiveModal({ type: 'APPROVE', restaurantId: r.id, restaurantName: r.name })}
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-black text-white shadow-sm min-h-[40px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setActiveModal({ type: 'REJECT', restaurantId: r.id, restaurantName: r.name })}
                          className="flex-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 text-xs font-bold min-h-[40px]"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {r.status === 'APPROVED' && (
                      <button
                        onClick={() => setActiveModal({ type: 'SUSPEND', restaurantId: r.id, restaurantName: r.name })}
                        className="flex-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 py-2 text-xs font-bold min-h-[40px]"
                      >
                        Suspend Store
                      </button>
                    )}

                    {(r.status === 'SUSPENDED' || r.status === 'REJECTED') && (
                      <button
                        onClick={() => setActiveModal({ type: 'REACTIVATE', restaurantId: r.id, restaurantName: r.name })}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-black text-white min-h-[40px]"
                      >
                        Reactivate Store
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setModalCommission(r.commissionRate ?? 15);
                        setActiveModal({ type: 'COMMISSION', restaurantId: r.id, restaurantName: r.name });
                      }}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 min-h-[40px]"
                    >
                      Rate %
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
                    <th className="pb-3">Restaurant</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Commission</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">{r.name}</td>
                      <td className="py-3 text-gray-600">{r.phone}</td>
                      <td className="py-3 text-gray-700">
                        {r.owner?.profile?.firstName ? `${r.owner.profile.firstName} ${r.owner.profile.lastName || ''}` : 'Partner'}
                      </td>
                      <td className="py-3 font-bold text-purple-700">{r.commissionRate ?? 15}%</td>
                      <td className="py-3">{getStatusBadge(r.status)}</td>
                      <td className="py-3 text-right space-x-1.5">
                        {r.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => setActiveModal({ type: 'APPROVE', restaurantId: r.id, restaurantName: r.name })}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActiveModal({ type: 'REJECT', restaurantId: r.id, restaurantName: r.name })}
                              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <button
                            onClick={() => setActiveModal({ type: 'SUSPEND', restaurantId: r.id, restaurantName: r.name })}
                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            Suspend
                          </button>
                        )}
                        {(r.status === 'SUSPENDED' || r.status === 'REJECTED') && (
                          <button
                            onClick={() => setActiveModal({ type: 'REACTIVATE', restaurantId: r.id, restaurantName: r.name })}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setModalCommission(r.commissionRate ?? 15);
                            setActiveModal({ type: 'COMMISSION', restaurantId: r.id, restaurantName: r.name });
                          }}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                          Rate %
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

      {/* ===================================================================== */}
      {/* ACTION BOTTOM SHEET / MODAL                                           */}
      {/* ===================================================================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-gray-900">
                {activeModal.type === 'APPROVE' && `Approve ${activeModal.restaurantName}`}
                {activeModal.type === 'REJECT' && `Reject ${activeModal.restaurantName}`}
                {activeModal.type === 'SUSPEND' && `Suspend ${activeModal.restaurantName}`}
                {activeModal.type === 'REACTIVATE' && `Reactivate ${activeModal.restaurantName}`}
                {activeModal.type === 'COMMISSION' && `Set Commission % for ${activeModal.restaurantName}`}
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
              {(activeModal.type === 'REJECT' || activeModal.type === 'SUSPEND') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mandatory Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide detailed compliance, hygiene, or verification failure reason..."
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {activeModal.type === 'COMMISSION' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contracted Commission Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={50}
                    value={modalCommission}
                    onChange={(e) => setModalCommission(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
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
                  className="flex-1 rounded-2xl bg-purple-600 hover:bg-purple-700 py-3 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
