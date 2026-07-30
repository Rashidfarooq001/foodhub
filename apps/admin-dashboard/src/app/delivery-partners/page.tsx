'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface DriverPartner {
  id: string;
  status: string;
  isApproved: boolean;
  licenseNumber: string;
  avgRating: number;
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

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/drivers`);
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
  }, []);

  const handleToggleApproval = async (driverId: string, currentApproved: boolean) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_admin_token') : null;
      const res = await fetch(`${API_BASE}/api/v1/drivers/${driverId}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isApproved: !currentApproved }),
      });

      if (res.ok) {
        fetchDrivers();
      }
    } catch {
      /* offline */
    }
  };

  const filtered = drivers.filter(
    (d) =>
      (d.user?.profile?.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.user?.phone || '').includes(search) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Delivery Fleet {isLoading ? '' : `(${filtered.length})`}
          </h1>
          <p className="text-xs text-gray-500">Active gig couriers, vehicle records &amp; duty status controls</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver name, phone, DL..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <Link
            href="/delivery-partners/add"
            className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 min-h-[40px]"
          >
            <Plus className="h-4 w-4 shrink-0" /> Add Driver
          </Link>
        </div>
      </div>

      {/* Mobile View: Cards (< 768px) */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            Loading delivery drivers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            No delivery partners found. Click &quot;Add Driver&quot; above to onboard one.
          </div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900">
                  {d.user?.profile?.firstName} {d.user?.profile?.lastName || ''}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black ${
                    d.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {d.isApproved ? 'APPROVED' : 'PENDING'}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Phone: {d.user?.phone || 'N/A'}</p>
                <p>Driving License: <span className="font-bold text-gray-800">{d.licenseNumber}</span></p>
                <p>Status: <span className="font-bold text-emerald-600">{d.status}</span></p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleToggleApproval(d.id, d.isApproved)}
                  className={`w-full min-h-[40px] rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    d.isApproved
                      ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {d.isApproved ? 'Suspend Driver' : 'Approve Partner'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table (>= 768px) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4">Contact Phone</th>
                <th className="px-6 py-4">Driving License</th>
                <th className="px-6 py-4">Duty Status</th>
                <th className="px-6 py-4">Approval</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading delivery drivers...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No delivery partners found. Click &quot;Add Driver&quot; above to onboard one.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {d.user?.profile?.firstName} {d.user?.profile?.lastName || ''}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{d.user?.phone}</td>
                    <td className="px-6 py-4 font-bold text-gray-600">{d.licenseNumber}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          d.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.isApproved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleApproval(d.id, d.isApproved)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          d.isApproved
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {d.isApproved ? 'Suspend Driver' : 'Approve Partner'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
