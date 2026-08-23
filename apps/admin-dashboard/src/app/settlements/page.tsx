'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Search, Store } from 'lucide-react';
import { adminFetch } from '../../utils/admin-fetch';
import Link from 'next/link';

export default function AdminFinancePage() {
  const [stats, setStats] = useState({
    totalGrossSales: 0,
    totalCommission: 0,
    totalGst: 0,
    totalPayable: 0,
    totalPaid: 0,
    totalPending: 0
  });
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch aggregate stats from backend
      const resStats: any = await adminFetch('/settlements/aggregate');
      if (resStats && !resStats.error) {
        setStats({
          totalGrossSales: resStats.totalGrossSales || 0,
          totalCommission: resStats.totalCommission || 0,
          totalGst: resStats.totalGst || 0,
          totalPayable: resStats.totalPayable || 0,
          totalPaid: resStats.totalPaid || 0,
          totalPending: resStats.totalPending || 0
        });
      }

      // Fetch restaurant settlements
      const resData: any = await adminFetch('/settlements');
      if (resData && resData.restaurants) {
        setRestaurants(resData.restaurants);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = restaurants.filter((r: any) => 
    r.restaurantName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto text-slate-900 bg-slate-50 min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Finance & Settlements</h1>
          <p className="text-slate-500">Manage real-time restaurant payouts and ledger balances.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Gross Food Sales</p>
            <p className="text-2xl font-bold">₹{stats.totalGrossSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-slate-50 text-slate-600 rounded-xl"><Store size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Platform Commission (13%)</p>
            <p className="text-2xl font-bold">₹{stats.totalCommission.toFixed(2)}</p>
            <p className="text-xs text-slate-400">+ ₹{stats.totalGst.toFixed(2)} GST</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><CreditCard size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Payouts</p>
            <p className="text-2xl font-bold text-red-600">₹{stats.totalPending.toFixed(2)}</p>
            <p className="text-xs text-green-600">Paid: ₹{stats.totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold">Restaurant Ledger</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search restaurant..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm">
                <th className="p-4 font-medium border-b border-slate-100">Restaurant</th>
                <th className="p-4 font-medium border-b border-slate-100">Orders</th>
                <th className="p-4 font-medium border-b border-slate-100">Gross Sales</th>
                <th className="p-4 font-medium border-b border-slate-100">Comm+GST</th>
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
                  <td colSpan={9} className="p-8 text-center text-slate-500">Loading live financial data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">No restaurants found.</td>
                </tr>
              ) : (
                filtered.map((r: any) => (
                  <tr key={r.restaurantId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold">{r.restaurantName}</p>
                    </td>
                    <td className="p-4 text-slate-600">{r.orderCount}</td>
                    <td className="p-4 font-medium">₹{(r.grossSales || 0).toFixed(2)}</td>
                    <td className="p-4 text-slate-500">
                      ₹{((r.commissionAmount || 0) + (r.gstAmount || 0)).toFixed(2)}
                    </td>
                    <td className="p-4 font-bold text-slate-900">₹{(r.netPayable || 0).toFixed(2)}</td>
                    <td className="p-4 text-green-600 font-medium">₹{(r.paidAmount || 0).toFixed(2)}</td>
                    <td className="p-4 text-red-600 font-bold">₹{(r.pendingAmount || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.pendingAmount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {r.pendingAmount > 0 ? 'Pending' : 'Settled'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/finance/${r.restaurantId}`} className="text-purple-600 font-medium hover:text-purple-800 text-sm">
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
