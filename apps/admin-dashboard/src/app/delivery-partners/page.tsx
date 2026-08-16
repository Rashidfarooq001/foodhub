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
  Bike,
  ShieldAlert,
  Phone,
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

  // Multi-select Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Reason & Confirmation Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'APPROVE' | 'SUSPEND' | 'REACTIVATE';
    driverId?: string;
    driverName?: string;
    isBulk?: boolean;
  } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDrivers = async () => {
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

      socket.on('driver.status_changed', (payload: { driverId: string; status?: string; isApproved?: boolean; dutyStatus?: string }) => {
        if (payload?.driverId) {
          setDrivers((prev) =>
            prev.map((d) =>
              d.id === payload.driverId
                ? {
                    ...d,
                    status: payload.status || payload.dutyStatus || d.status,
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
      /* socket error */
    }
  }, []);

  const executeDriverStatusChange = async (driverId: string, isApproved: boolean, reason?: string) => {
    try {
      const res = await adminFetch(`/drivers/${driverId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved, reason }),
      });
      if (res.ok) {
        return { success: true, driverId };
      }
      return { success: false, driverId };
    } catch {
      return { success: false, driverId };
    }
  };

  const handleConfirmModal = async () => {
    if (!activeModal) return;
    setIsProcessing(true);

    const isApprovalAction = activeModal.type === 'APPROVE' || activeModal.type === 'REACTIVATE';

    if (activeModal.isBulk) {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        const res = await executeDriverStatusChange(id, isApprovalAction, modalReason);
        if (res.success) successCount++;
        else failCount++;
      }

      setBulkResults({
        message: `Bulk Action: ${successCount} riders updated successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
        type: failCount === 0 ? 'success' : 'info',
      });

      setSelectedIds([]);
      setIsProcessing(false);
      setActiveModal(null);
      setModalReason('');
      fetchDrivers();
      return;
    }

    if (activeModal.driverId) {
      await executeDriverStatusChange(activeModal.driverId, isApprovalAction, modalReason);
      setIsProcessing(false);
      setActiveModal(null);
      setModalReason('');
      fetchDrivers();
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filtered = drivers.filter((d) => {
    const name = `${d.user?.profile?.firstName || ''} ${d.user?.profile?.lastName || ''}`.toLowerCase();
    const phone = (d.user?.phone || '').toLowerCase();
    const license = (d.licenseNumber || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase()) || license.includes(search.toLowerCase());

    const isSuspended = d.status === 'SUSPENDED' || !d.isApproved;
    const isOnline = d.status === 'ONLINE';
    const isOffline = d.status === 'OFFLINE';

    let matchesStatus = true;
    if (statusFilter === 'APPROVED') matchesStatus = d.isApproved && d.status !== 'SUSPENDED';
    else if (statusFilter === 'SUSPENDED') matchesStatus = isSuspended;
    else if (statusFilter === 'ONLINE') matchesStatus = isOnline;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Delivery Partner Fleet {isLoading ? '' : `(${drivers.length})`}
          </h1>
          <p className="text-xs text-gray-500">
            Courier partner lifecycle management, live status stream &amp; suspension controls
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rider, phone, license..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <Link
            href="/delivery-partners/applications"
            className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 min-h-[40px]"
          >
            <Plus className="h-4 w-4 shrink-0" /> Pending Applications
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {['ALL', 'APPROVED', 'ONLINE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                statusFilter === st
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st === 'ALL' ? 'All Fleet' : st}
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
                <th className="px-6 py-4">Rider / Partner</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Driving License</th>
                <th className="px-6 py-4">Duty Status</th>
                <th className="px-6 py-4">Approval State</th>
                <th className="px-6 py-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading delivery partner fleet...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No delivery partners match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const isSelected = selectedIds.includes(d.id);
                  const riderName = d.user?.profile?.firstName
                    ? `${d.user.profile.firstName} ${d.user.profile.lastName || ''}`
                    : 'Courier Partner';
                  const vehicle = d.vehicles && d.vehicles.length > 0 ? d.vehicles[0] : null;

                  return (
                    <tr key={d.id} className={`hover:bg-gray-50/50 ${isSelected ? 'bg-purple-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(d.id)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{riderName}</span>
                        <span className="text-[11px] text-gray-400">{d.user?.phone || 'No phone'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800 block">
                          {vehicle ? vehicle.vehicleType.replace('_', ' ') : 'Motorcycle'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {vehicle?.vehicleNumber || 'Unregistered'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-700">
                        {d.licenseNumber || 'Verified'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            d.status === 'ONLINE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'BUSY'
                              ? 'bg-blue-100 text-blue-800'
                              : d.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            d.isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.isApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!d.isApproved ? (
                            <button
                              onClick={() =>
                                setActiveModal({
                                  type: 'APPROVE',
                                  driverId: d.id,
                                  driverName: riderName,
                                })
                              }
                              className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              Approve
                            </button>
                          ) : d.status === 'SUSPENDED' ? (
                            <button
                              onClick={() =>
                                setActiveModal({
                                  type: 'REACTIVATE',
                                  driverId: d.id,
                                  driverName: riderName,
                                })
                              }
                              className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setActiveModal({
                                  type: 'SUSPEND',
                                  driverId: d.id,
                                  driverName: riderName,
                                })
                              }
                              className="rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Suspend
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
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 font-bold">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              )}

              <div>
                <h3 className="text-base font-black text-gray-900">
                  {activeModal.isBulk
                    ? `Bulk ${activeModal.type} (${selectedIds.length} Riders)`
                    : `${activeModal.type} Rider: ${activeModal.driverName}`}
                </h3>
                <p className="text-xs text-gray-500">
                  Action will be logged to Audit Log with timestamp and admin identity.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">
                {activeModal.type === 'SUSPEND' ? 'Reason for Suspension (Required)' : 'Notes (Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  activeModal.type === 'SUSPEND'
                    ? 'Specify reason for driver suspension...'
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
                  activeModal.type === 'APPROVE' || activeModal.type === 'REACTIVATE'
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
