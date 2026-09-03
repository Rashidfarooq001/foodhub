'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Search, Store, Bike, CheckCircle } from 'lucide-react';
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

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; type: 'restaurant'|'rider'; id: string; name: string; amount: number; error: string | null; processing: boolean } | null>(null);

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
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!paymentModal) return;
    setPaymentModal({ ...paymentModal, processing: true, error: null });

    try {
      const endpoint = paymentModal.type === 'restaurant' 
        ? `/settlements/restaurant/${paymentModal.id}/record-payment`
        : `/settlements/rider/${paymentModal.id}/record-payment`;

      const res = await adminFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentModal.amount,
          paymentMethod: 'OTHER',
          transactionReference: 'MANUAL_DASHBOARD',
          periodType: period,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Payment failed');
      }

      // Success
      setPaymentModal(null);
      fetchData(); // refresh data
    } catch (err: any) {
      setPaymentModal({ ...paymentModal, processing: false, error: err.message });
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.restaurant?.name?.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === 'All' || r.status === statusFilter.toUpperCase())
  );

  const filteredRiders = riders.filter(
    (r) => {
      const name = `${r.driver?.user?.profile?.firstName || ''} ${r.driver?.user?.profile?.lastName || ''}`.toLowerCase();
      return name.includes(search.toLowerCase()) && (statusFilter === 'All' || r.settlementStatus === statusFilter.toUpperCase());
    }
  );

  return (
    <div className="space-y-6 w-full pb-16 relative">
      {/* Payment Confirmation Modal */}
      {paymentModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Payment</h3>
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{paymentModal.type === 'restaurant' ? 'Restaurant' : 'Delivery Partner'}:</span>
                <span className="font-bold text-gray-900">{paymentModal.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Payable:</span>
                <span className="font-bold text-purple-700">₹{paymentModal.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Period:</span>
                <span className="font-bold text-gray-900">{period === 'current' ? 'Last 7 Days' : period === 'monthly' ? 'Last 30 Days' : period}</span>
              </div>
            </div>

            {paymentModal.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {paymentModal.error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setPaymentModal(null)}
                disabled={paymentModal.processing}
                className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handlePay}
                disabled={paymentModal.processing}
                className="px-4 py-2 font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm disabled:opacity-50 transition flex items-center gap-2"
              >
                {paymentModal.processing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance & Settlements</h1>
        <p className="text-slate-500 text-sm mt-1">Platform revenue, payouts, and financial health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Food Sales</span>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">₹{Number(stats.totalGrossSales || 0).toFixed(2)}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Revenue</span>
            <CreditCard size={16} className="text-purple-500" />
          </div>
          <h2 className="text-2xl font-black text-purple-700">₹{Number(stats.totalCommission || 0).toFixed(2)}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Restaurants</span>
            <Store size={16} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-amber-600">₹{Number(stats.totalRestaurantPending || 0).toFixed(2)}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Riders</span>
            <Bike size={16} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-amber-600">₹{Number(stats.totalRiderPending || 0).toFixed(2)}</h2>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mt-8">
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
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="current">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
            </select>
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
                    No restaurants found in this period.
                  </td>
                </tr>
              ) : activeTab === 'rider' && filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No riders found in this period.
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
                    <td className="p-4 font-medium">₹{Number(r.grossSales || 0).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">₹{Number(r.commissionAmount || 0).toFixed(2)}</td>
                    <td className="p-4 font-bold text-slate-900">
                      ₹{Number(r.netPayable || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-green-600 font-medium">
                      ₹{Number(r.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-red-600 font-bold">
                      ₹{Number(r.pendingAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      {r.status === 'PENDING' && Number(r.pendingAmount) > 0 && (
                        <button
                          onClick={() => setPaymentModal({ isOpen: true, type: 'restaurant', id: r.restaurant.id, name: r.restaurant.name, amount: Number(r.pendingAmount), error: null, processing: false })}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition shadow-sm"
                        >
                          PAY
                        </button>
                      )}
                      <Link
                        href={`/finance/restaurant/${r.restaurant.id}`}
                        className="text-purple-600 font-medium hover:text-purple-800 text-sm whitespace-nowrap"
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
                    <td className="p-4 font-medium">₹{Number(r.totalEarnings || 0).toFixed(2)}</td>
                    <td className="p-4 font-bold text-slate-900">
                      ₹{Number(r.totalEarnings || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-green-600 font-medium">
                      ₹{Number(r.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-red-600 font-bold">
                      ₹{Number(r.pendingAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${r.settlementStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                      >
                        {r.settlementStatus}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      {r.settlementStatus === 'PENDING' && Number(r.pendingAmount) > 0 && (
                        <button
                          onClick={() => setPaymentModal({ isOpen: true, type: 'rider', id: r.driver.id, name: `${r.driver.user?.profile?.firstName || ''} ${r.driver.user?.profile?.lastName || ''}`.trim(), amount: Number(r.pendingAmount), error: null, processing: false })}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition shadow-sm"
                        >
                          PAY
                        </button>
                      )}
                      <Link
                        href={`/finance/rider/${r.driver.id}`}
                        className="text-purple-600 font-medium hover:text-purple-800 text-sm whitespace-nowrap"
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
