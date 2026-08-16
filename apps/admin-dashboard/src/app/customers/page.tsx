'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, AlertCircle, ShoppingBag, MapPin, Calendar } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCustomers = async (currentPage = page, searchQuery = search) => {
    setIsLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(searchQuery);
      const res = await adminFetch(`/users/customers?page=${currentPage}&limit=25&search=${q}`);
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
  }, [search]);

  const toggleStatus = async (userId: string, currentActive: boolean) => {
    setUpdatingId(userId);
    try {
      const res = await adminFetch(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.userId === userId ? { ...c, isActive: !currentActive } : c)),
        );
      }
    } catch {
      /* offline */
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Customer Directory ({totalCount})</h1>
          <p className="text-xs text-gray-500">Live registered customer profiles, lifetime order metrics &amp; account controls</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
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
            disabled={isLoading}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customers Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Order Metrics</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Saved Addresses</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold">
                    Loading customer profiles from PostgreSQL...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {c.id.slice(0, 8)}...</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium font-mono">{c.phone}</p>
                      <p className="text-[10px] text-gray-400">{c.email}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-black text-gray-900">
                        <ShoppingBag className="h-3.5 w-3.5 text-purple-600" />
                        <span>{c.totalOrders} total</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        {c.completedOrders} completed • {c.cancelledOrders} cancelled
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-black text-gray-900 text-sm">₹{c.totalSpent.toLocaleString('en-IN')}</span>
                      {c.lastOrderDate && (
                        <p className="text-[10px] text-gray-400">
                          Last: {new Date(c.lastOrderDate).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-gray-700 font-bold">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        <span>{c.addressCount} {c.addressCount === 1 ? 'address' : 'addresses'}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(c.userId, c.isActive)}
                        disabled={updatingId === c.userId}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                          c.isActive
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        } disabled:opacity-40`}
                      >
                        {updatingId === c.userId
                          ? 'Updating...'
                          : c.isActive
                          ? 'Suspend Account'
                          : 'Activate Account'}
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
