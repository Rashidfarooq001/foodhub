'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../../../utils/admin-fetch';
import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function RestaurantFinanceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/settlements/restaurant/${id}/detail?periodType=current`);
      if (!res.ok) throw new Error('Failed to load restaurant details');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading restaurant settlements...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-gray-500">No data found</div>;

  const restaurant = data.restaurant || {};
  const stats = data.summary || {};
  const orders = data.orders || [];

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        <Link href="/settlements" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-purple-600" />
            {restaurant.name || 'Restaurant'}
          </h1>
          <p className="text-sm text-gray-500">Ledger & Settlement Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalOrders || 0}</p>
        </div>
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gross Sales</p>
          <p className="text-2xl font-black text-gray-900">?{stats.totalGrossSales?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Net Payable</p>
          <p className="text-2xl font-black text-purple-600">?{stats.totalPayable?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Paid</p>
          <p className="text-2xl font-black text-green-600">?{stats.totalPaid?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Order Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Gross</th>
                <th className="p-4 font-bold">Commission</th>
                <th className="p-4 font-bold">GST on Comm</th>
                <th className="p-4 font-bold text-right">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No orders found in this period.</td>
                </tr>
              ) : (
                orders.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-xs">{o.order?.orderNumber || o.orderId?.slice(0, 8)}</td>
                    <td className="p-4 text-gray-900">?{o.grossSalesAmount?.toFixed(2)}</td>
                    <td className="p-4 text-red-600">-?{o.commissionAmount?.toFixed(2)}</td>
                    <td className="p-4 text-red-600">-?{o.commissionGstAmount?.toFixed(2)}</td>
                    <td className="p-4 text-purple-700 font-bold text-right">?{o.netPayable?.toFixed(2)}</td>
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
