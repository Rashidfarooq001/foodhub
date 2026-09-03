'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Search, Store, Bike } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';
import Link from 'next/link';

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'rider'>('restaurant');
  const [period, setPeriod] = useState('current');
  const [stats, setStats] = useState<any>({});
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [resStats, resRest, resRider] = await Promise.all([
        adminFetch(`/settlements/overview?periodType=${period}`),
        adminFetch(`/settlements/restaurants?periodType=${period}`),
        adminFetch(`/settlements/riders?periodType=${period}`)
      ]);

      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.overview || {});
      }

      if (resRest.ok) {
        const data = await resRest.json();
        setRestaurants(data.data || []);
      }

      if (resRider.ok) {
        const data = await resRider.json();
        setRiders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((r: any) => {
    if (!r.restaurant.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter.toUpperCase()) return false;
    return true;
  });

  const filteredRiders = riders.filter((r: any) => {
    const name =
      `${r.driver.user?.profile?.firstName || ''} ${r.driver.user?.profile?.lastName || ''}`.trim();
    if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'All' && r.settlementStatus !== statusFilter.toUpperCase()) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto text-slate-900 bg-slate-50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Finance & Settlements</h1>
          <p className="text-slate-500">
            Manage real-time payouts and ledger balances from one authoritative source.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="current">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Gross Food Sales</p>
            <p className="text-2xl font-bold">₹{(stats.grossSales || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-slate-50 text-slate-600 rounded-xl">
            <Store size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Platform Revenue</p>
            <p className="text-2xl font-bold">₹{(stats.zaykaRevenue || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Restaurants</p>
            <p className="text-2xl font-bold text-amber-600">
              ₹{(stats.pendingRestaurantSettlements || 0).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Bike size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Riders</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{(stats.pendingRiderSettlements || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('restaurant')}
          className={`pb-3 px-4 font-semibold ${activeTab === 'restaurant' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          RESTAURANT SETTLEMENTS
        </button>
        <button
          onClick={() => setActiveTab('rider')}
          className={`pb-3 px-4 font-semibold ${activeTab === 'rider' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          DELIVERY PARTNER SETTLEMENTS
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
          <h2 className="text-lg font-bold">
            {activeTab === 'restaurant' ? 'Restaurant Ledger' : 'Rider Ledger'}
          </h2>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 font-medium text-sm text-slate-700 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  activeTab === 'restaurant' ? 'Search restaurant...' : 'Search rider...'
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm">
                <th className="p-4 font-medium border-b border-slate-100">
                  {activeTab === 'restaurant' ? 'Restaurant' : 'Rider'}
                </th>
                <th className="p-4 font-medium border-b border-slate-100">
                  {activeTab === 'restaurant' ? 'Orders' : 'Deliveries'}
                </th>
                <th className="p-4 font-medium border-b border-slate-100">Gross Amount</th>
                {activeTab === 'restaurant' && (
                  <th className="p-4 font-medium border-b border-slate-100">Commission</th>
                )}
                <th className="p-4 font-medium border-b border-slate-100">Net Payable</th>
                <th className="p-4 font-medium border-b border-slate-100">Paid</th>
                <th className="p-4 font-medium border-b border-slate-100">Pending</th>
                <th className="p-4 font-medium border-b border-slate-100">Status</th>
                <th className="p-4 font-medium border-b border-slate-100">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Loading live financial data...
                  </td>
                </tr>
              ) : activeTab === 'restaurant' && filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No restaurants found.
                  </td>
                </tr>
              ) : activeTab === 'rider' && filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No riders found.
                  </td>
                </tr>
              ) : activeTab === 'restaurant' ? (
                filteredRestaurants.map((r: any) => (
                  <tr
                    key={r.restaurant.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold">{r.restaurant.name}</td>
                    <td className="p-4 text-slate-600">{r.orderCount}</td>
                    <td className="p-4 font-medium">₹{(r.grossSales || 0).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">₹{(r.commissionAmount || 0).toFixed(2)}</td>
                    <td className="p-4 font-bold text-slate-900">
                      ₹{(r.netPayable || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-green-600 font-medium">
                      ₹{(r.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-red-600 font-bold">
                      ₹{(r.pendingAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/finance/restaurant/${r.restaurant.id}`}
                        className="text-purple-600 font-medium hover:text-purple-800 text-sm"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                filteredRiders.map((r: any) => (
                  <tr
                    key={r.driver.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold">
                      {`${r.driver.user?.profile?.firstName || ''} ${r.driver.user?.profile?.lastName || ''}`.trim()}
                    </td>
                    <td className="p-4 text-slate-600">{r.completedDeliveries}</td>
                    <td className="p-4 font-medium">₹{(r.totalEarnings || 0).toFixed(2)}</td>
                    <td className="p-4 font-bold text-slate-900">
                      ₹{(r.totalEarnings || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-green-600 font-medium">
                      ₹{(r.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-red-600 font-bold">
                      ₹{(r.pendingAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${r.settlementStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {r.settlementStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/finance/rider/${r.driver.id}`}
                        className="text-purple-600 font-medium hover:text-purple-800 text-sm"
                      >
                        View Details →
                      </Link>
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
