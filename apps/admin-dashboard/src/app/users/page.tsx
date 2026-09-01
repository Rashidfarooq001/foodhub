'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Store,
  Bike,
} from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

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
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await adminFetch(`/users?${params.toString()}`);
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
      const res = await adminFetch(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentIsActive }),
      });

      if (res.ok) {
        setActionSuccess(
          `User account ${!currentIsActive ? 'activated' : 'deactivated'} successfully.`,
        );
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
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            User Account Management
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Real-time user directory (Customers, Restaurant Owners, Couriers &amp; Admins)
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition min-h-[40px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800 flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-purple-600 hover:bg-purple-700 px-5 py-3 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
          >
            Search
          </button>
        </form>

        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition min-h-[40px] ${
                roleFilter === r
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Directory (Dual Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          User Accounts ({users.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">
            Loading user accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No user accounts found matching query.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block lg:hidden space-y-3">
              {users.map((u) => {
                const fullName = u.profile?.firstName
                  ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim()
                  : 'User';

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 font-black text-purple-700 text-xs shrink-0">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-gray-900">{fullName}</h3>
                          <p className="text-[11px] text-gray-500 font-medium">{u.phone}</p>
                        </div>
                      </div>

                      <span
                        className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">
                          Role
                        </span>
                        <span className="font-bold text-gray-900">{u.role.replace('_', ' ')}</span>
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">
                          Associated
                        </span>
                        {u.restaurant ? (
                          <span className="font-bold text-amber-900 truncate block">
                            🏬 {u.restaurant.name}
                          </span>
                        ) : u.driver ? (
                          <span className="font-bold text-blue-900 truncate block">🛵 Courier</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`w-full rounded-xl py-2.5 text-xs font-bold transition shadow-sm min-h-[40px] flex items-center justify-center gap-1.5 ${
                          u.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="h-4 w-4" /> Deactivate Account
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" /> Activate Account
                          </>
                        )}
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
                    <th className="pb-3">User Info</th>
                    <th className="pb-3">Phone / Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Associated Entity</th>
                    <th className="pb-3">Account Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {users.map((u) => {
                    const fullName = u.profile?.firstName
                      ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim()
                      : 'User';

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-bold text-gray-900 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 font-black text-purple-700 text-xs">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <span>{fullName}</span>
                        </td>
                        <td className="py-3 font-mono text-gray-600">{u.phone}</td>
                        <td className="py-3">
                          <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-800">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-gray-700">
                          {u.restaurant ? (
                            <span className="text-amber-900 font-bold">🏬 {u.restaurant.name}</span>
                          ) : u.driver ? (
                            <span className="text-blue-900 font-bold">🛵 Courier</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              u.isActive
                                ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
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
    </div>
  );
}
