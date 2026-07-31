'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';

interface Restaurant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  deliveryMode?: 'FOODHUB_DELIVERY' | 'RESTAURANT_SELF_DELIVERY';
  avgRating?: number;
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
  }, []);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING') => {
    // Immediate optimistic state update
    if (status === 'REJECTED') {
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: status as any } : r)),
      );
    }

    try {
      const res = await adminFetch(`/restaurants/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        fetchRestaurants();
      }
    } catch {
      fetchRestaurants();
    }
  };

  const filtered = Array.isArray(restaurants)
    ? restaurants.filter(
        (r) =>
          r &&
          ((r.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.phone || '').toLowerCase().includes(search.toLowerCase())),
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Registered Restaurants {isLoading ? '' : `(${filtered.length})`}
          </h1>
          <p className="text-xs text-gray-500">Live merchant catalog, onboarding &amp; status controls</p>
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
            href="/restaurants/add"
            className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 min-h-[40px]"
          >
            <Plus className="h-4 w-4 shrink-0" /> Add Restaurant
          </Link>
        </div>
      </div>

      {/* Mobile View: Cards (< 768px) */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            Loading restaurant directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-xs font-bold text-gray-400">
            No restaurants registered yet. Click &quot;Add Restaurant&quot; above to onboard one.
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r?.id || Math.random().toString()} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900">{r?.name || 'Unnamed Restaurant'}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black ${
                    r?.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r?.status === 'SUSPENDED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r?.status || 'PENDING'}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                <p>Owner: {r?.owner?.profile?.firstName ? `${r.owner.profile.firstName} ${r.owner.profile.lastName || ''}` : 'Owner'} ({r?.phone || 'N/A'})</p>
                <p className="font-bold text-amber-600 mt-1">★ {r?.avgRating || 4.8}/5 Rating</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {r?.status !== 'APPROVED' && (
                  <button
                    onClick={() => r?.id && handleUpdateStatus(r.id, 'APPROVED')}
                    className="flex-1 min-h-[40px] rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                  >
                    Approve / Reactivate
                  </button>
                )}
                {r?.status === 'APPROVED' && (
                  <button
                    onClick={() => r?.id && handleUpdateStatus(r.id, 'SUSPENDED')}
                    className="flex-1 min-h-[40px] rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Suspend Store
                  </button>
                )}
                {r?.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => r?.id && handleUpdateStatus(r.id, 'REJECTED')}
                    className="min-h-[40px] rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Reject
                  </button>
                )}
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
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Delivery Mode</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading restaurants...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No restaurants registered yet. Click &quot;Add Restaurant&quot; above to onboard one.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r?.id || Math.random().toString()} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">{r?.name || 'Unnamed Restaurant'}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {r?.owner?.profile?.firstName ? `${r.owner.profile.firstName} ${r.owner.profile.lastName || ''}` : 'Owner'} ({r?.phone || 'N/A'})
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                        r?.deliveryMode === 'RESTAURANT_SELF_DELIVERY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r?.deliveryMode === 'RESTAURANT_SELF_DELIVERY' ? 'Self Delivery' : 'FoodHub Fleet'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-amber-600">★ {r?.avgRating || 4.8}/5</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          r?.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r?.status === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {r?.status !== 'APPROVED' && (
                          <button
                            onClick={() => r?.id && handleUpdateStatus(r.id, 'APPROVED')}
                            className="rounded-xl border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                          >
                            Approve / Reactivate
                          </button>
                        )}
                        {r?.status === 'APPROVED' && (
                          <button
                            onClick={() => r?.id && handleUpdateStatus(r.id, 'SUSPENDED')}
                            className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            Suspend Store
                          </button>
                        )}
                        {r?.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => r?.id && handleUpdateStatus(r.id, 'REJECTED')}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
                          >
                            Reject
                          </button>
                        )}
                      </div>
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
