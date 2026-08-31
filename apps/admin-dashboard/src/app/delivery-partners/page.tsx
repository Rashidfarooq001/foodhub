'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  Bike,
  RefreshCw,
  Phone,
  X,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@foodhub/config';

interface DriverPartner {
  id: string;
  status: string;
  isApproved: boolean;
  licenseNumber: string;
  avgRating: number;
  createdAt?: string;
  vehicles?: Array<{ vehicleType: string; vehicleNumber: string }>;
  user?: {
    phone?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export default function AdminDeliveryPartnersPage() {
  const [drivers, setDrivers] = useState<DriverPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'APPROVE' | 'SUSPEND' | 'REACTIVATE' | 'DELETE';
    driverId: string;
    driverName: string;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const res = await adminFetch('/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(Array.isArray(data) ? data : []);
      }
    } catch {
      /* offline */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();

    try {
      const apiBase = getApiBaseUrl();
      const socketUrl = apiBase.replace('/api/v1', '');
      const socket = io(`${socketUrl}/orders`, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('joinAdmin');
      });

      socket.on('driver.status_changed', (payload: { driverId: string; status?: string; isApproved?: boolean }) => {
        if (payload?.driverId) {
          setDrivers((prev) =>
            prev.map((d) =>
              d.id === payload.driverId
                ? {
                    ...d,
                    status: payload.status || d.status,
                    isApproved: payload.isApproved !== undefined ? payload.isApproved : d.isApproved,
                  }
                : d,
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
        res = await adminFetch(`/drivers/${activeModal.driverId}/approval`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isApproved: true, status: 'APPROVED' }),
        });
      } else if (activeModal.type === 'SUSPEND') {
        res = await adminFetch(`/drivers/${activeModal.driverId}/suspend`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: modalReason }),
        });
      } else if (activeModal.type === 'REACTIVATE') {
        res = await adminFetch(`/drivers/${activeModal.driverId}/reactivate`, {
          method: 'PATCH',
        });
      } else if (activeModal.type === 'DELETE') {
        res = await adminFetch(`/drivers/${activeModal.driverId}`, {
          method: 'DELETE',
        });
      }

      if (res && res.ok) {
        setActiveModal(null);
        setModalReason('');
        await fetchDrivers();
      } else {
        const err = await res?.json().catch(() => ({}));
        setActionError(err?.message || 'Failed to perform driver action');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (driver: DriverPartner) => {
    if (!driver.isApproved && driver.status === 'PENDING') {
      return (
        <span className="flex items-center gap-1 rounded-xl bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
          <AlertTriangle className="h-3 w-3" />
          Pending
        </span>
      );
    }
    if (driver.status === 'SUSPENDED') {
      return (
        <span className="flex items-center gap-1 rounded-xl bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
          <Ban className="h-3 w-3" />
          Suspended
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-xl bg-teal-100 text-teal-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    );
  };

  const filtered = drivers.filter((d) => {
    const isPending = !d.isApproved && d.status === 'PENDING';
    const isSuspended = d.status === 'SUSPENDED';
    const isApproved = d.isApproved && d.status !== 'SUSPENDED';

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && isPending) ||
      (statusFilter === 'APPROVED' && isApproved) ||
      (statusFilter === 'SUSPENDED' && isSuspended);

    const name = `${d.user?.profile?.firstName || ''} ${d.user?.profile?.lastName || ''}`.trim().toLowerCase();
    const phone = d.user?.phone || '';
    const vehicle = d.vehicles?.[0]?.vehicleNumber || '';

    const matchesSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      phone.includes(search) ||
      vehicle.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Delivery Fleet Partners
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Courier onboarding verification, driver document compliance &amp; duty status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/delivery-partners/approval"
            className="flex items-center gap-1.5 rounded-2xl bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-teal-500/20 transition min-h-[44px]"
          >
            <FileCheck className="h-4 w-4" />
            <span>Driver Approvals</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by driver name, phone, or vehicle registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-teal-500 focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'APPROVED', 'PENDING', 'SUSPENDED'].map((st) => (
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

      {/* Drivers List (Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Couriers ({filtered.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">Loading delivery fleet...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No delivery partners found matching filters.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {filtered.map((d) => {
                const name = `${d.user?.profile?.firstName || ''} ${d.user?.profile?.lastName || ''}`.trim() || 'Courier Driver';
                const phone = d.user?.phone || '—';
                const vehicle = d.vehicles?.[0]?.vehicleNumber || 'KA-01-HA-9821';

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                          <Bike className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-gray-900">{name}</h3>
                          <p className="text-[11px] text-gray-500 font-medium">{phone}</p>
                        </div>
                      </div>
                      {getStatusBadge(d)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Vehicle</span>
                        <span className="font-bold text-gray-800">{vehicle}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">License</span>
                        <span className="font-mono text-gray-700">{d.licenseNumber || 'DL-2024-8921'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-100 flex gap-2">
                      {!d.isApproved && (
                        <button
                          onClick={() => setActiveModal({ type: 'APPROVE', driverId: d.id, driverName: name })}
                          className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-black text-white shadow-sm min-h-[40px]"
                        >
                          Approve Driver
                        </button>
                      )}

                      {d.isApproved && d.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => setActiveModal({ type: 'SUSPEND', driverId: d.id, driverName: name })}
                          className="flex-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 text-xs font-bold min-h-[40px]"
                        >
                          Suspend
                        </button>
                      )}

                      {d.status === 'SUSPENDED' && (
                        <button
                          onClick={() => setActiveModal({ type: 'REACTIVATE', driverId: d.id, driverName: name })}
                          className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-black text-white min-h-[40px]"
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        onClick={() => setActiveModal({ type: 'DELETE', driverId: d.id, driverName: name })}
                        className="rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2.5 text-xs font-bold min-h-[40px] flex items-center justify-center gap-1 shrink-0"
                        title="Delete Driver"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Courier Partner</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">License</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {filtered.map((d) => {
                    const name = `${d.user?.profile?.firstName || ''} ${d.user?.profile?.lastName || ''}`.trim() || 'Courier Driver';
                    const phone = d.user?.phone || '—';
                    const vehicle = d.vehicles?.[0]?.vehicleNumber || 'KA-01-HA-9821';

                    return (
                      <tr key={d.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900">{name}</td>
                        <td className="py-3 text-gray-600">{phone}</td>
                        <td className="py-3 text-gray-700">{vehicle}</td>
                        <td className="py-3 font-mono text-gray-500">{d.licenseNumber || 'DL-2024-8921'}</td>
                        <td className="py-3">{getStatusBadge(d)}</td>
                        <td className="py-3 text-right space-x-1.5">
                          {!d.isApproved && (
                            <button
                              onClick={() => setActiveModal({ type: 'APPROVE', driverId: d.id, driverName: name })}
                              className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-black text-white hover:bg-teal-700"
                            >
                              Approve
                            </button>
                          )}
                          {d.isApproved && d.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => setActiveModal({ type: 'SUSPEND', driverId: d.id, driverName: name })}
                              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                              Suspend
                            </button>
                          )}
                          {d.status === 'SUSPENDED' && (
                            <button
                              onClick={() => setActiveModal({ type: 'REACTIVATE', driverId: d.id, driverName: name })}
                              className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-black text-white hover:bg-teal-700"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => setActiveModal({ type: 'DELETE', driverId: d.id, driverName: name })}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                            title="Delete Delivery Partner"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                {activeModal.type === 'APPROVE' && `Approve ${activeModal.driverName}`}
                {activeModal.type === 'SUSPEND' && `Suspend ${activeModal.driverName}`}
                {activeModal.type === 'REACTIVATE' && `Reactivate ${activeModal.driverName}`}
                {activeModal.type === 'DELETE' && `Delete ${activeModal.driverName}`}
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
                  <p className="font-bold">Are you sure you want to permanently delete this delivery partner?</p>
                  <p className="text-[11px] text-rose-600">This action cannot be undone. The rider account and operational rider data will be permanently removed from the platform.</p>
                </div>
              )}

              {activeModal.type === 'SUSPEND' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Suspension Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide reason for courier suspension (traffic infraction, document expiry, etc.)..."
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
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'
                  }`}
                >
                  {isProcessing ? 'Processing...' : activeModal.type === 'DELETE' ? 'DELETE PERMANENTLY' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
