'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bike, Plus, Search, CheckCircle2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
    } catch { /* offline */ } finally {
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
    } catch { /* offline */ }
  };

  const filtered = drivers.filter((d) =>
    (d.user?.profile?.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.user?.phone || '').includes(search) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Delivery Fleet {isLoading ? '' : `(${filtered.length})`}
          </h1>
          <p className="text-xs text-gray-500">Active gig couriers, vehicle records &amp; duty status controls</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
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
            className="flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" /> Add Driver
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
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
  );
}
