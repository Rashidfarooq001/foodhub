'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ShieldCheck, CheckCircle, XCircle, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface UserItem {
  id: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  } | null;
  restaurant?: {
    id: string;
    name: string;
    status: string;
  } | null;
  driver?: {
    id: string;
    status: string;
    isApproved: boolean;
  } | null;
}

export default function AdminUsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('foodhub_admin_token');
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${API_BASE}/users?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to fetch user directory.');
      }
    } catch {
      setError('Connection error loading user accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (userId: string, currentIsActive: boolean) => {
    setActionSuccess(null);
    try {
      const token = localStorage.getItem('foodhub_admin_token');
      const res = await fetch(`${API_BASE}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });

      if (res.ok) {
        setActionSuccess(`User account ${!currentIsActive ? 'activated' : 'deactivated'} successfully.`);
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to update user status.');
      }
    } catch {
      alert('Error updating user status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">User Account Management</h1>
          <p className="text-xs text-gray-500">
            Real-time PostgreSQL user directory (Customers, Restaurant Owners, Delivery Partners &amp; Admins)
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-700">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="RESTAURANT_OWNER">Restaurant Owner</option>
            <option value="DELIVERY_PARTNER">Delivery Partner</option>
            <option value="ADMIN">Admin / SuperAdmin</option>
          </select>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="w-full rounded-2xl border border-gray-200 py-2 pl-9 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Directory Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 uppercase tracking-wider text-[10px] font-black text-gray-400 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">User Info</th>
              <th className="px-6 py-4">Phone / Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Associated Entity</th>
              <th className="px-6 py-4">Account Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs font-bold text-gray-400">
                  Loading user records from PostgreSQL database...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs font-bold text-gray-400">
                  No user accounts found matching your query.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const fullName = u.profile?.firstName
                  ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim()
                  : 'User';

                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-black text-orange-700 text-xs">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{fullName}</div>
                          <div className="text-[10px] font-semibold text-gray-400 font-mono">{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">
                      <div>{u.phone}</div>
                      {u.email && <div className="text-[11px] text-gray-500 font-sans">{u.email}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-xl bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase text-gray-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {u.restaurant ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                          <span>🏬 {u.restaurant.name}</span>
                          <span className="text-[9px] bg-amber-100 px-1.5 py-0.5 rounded font-black text-amber-800">
                            {u.restaurant.status}
                          </span>
                        </div>
                      ) : u.driver ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-900 font-bold">
                          <span>🛵 Rider ({(u.driver as any).vehicles?.[0]?.vehicleNumber || u.driver.id.slice(0, 8)})</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${u.driver.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {u.driver.isApproved ? 'APPROVED' : 'REVIEW'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-700 border border-rose-200">
                          <XCircle className="h-3 w-3" /> DEACTIVATED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                          u.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="h-3.5 w-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
