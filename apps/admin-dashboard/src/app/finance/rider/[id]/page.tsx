'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../../../utils/admin-fetch';
import { ArrowLeft, Bike } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function RiderFinanceDetailPage() {
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
      const res = await adminFetch(`/settlements/rider/${id}/detail?periodType=current`);
      if (!res.ok) throw new Error('Failed to load rider details');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading rider settlements...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-gray-500">No data found</div>;

  const rider = data.driver || {};
  const stats = data.financialSummary || {};
  const deliveries = data.deliveries || [];

  return (
    <div className="space-y-6 w-full pb-16">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        <Link href="/settlements" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bike className="w-6 h-6 text-purple-600" />
            {rider.user?.profile?.firstName || 'Rider'} {rider.user?.profile?.lastName || ''}
          </h1>
          <p className="text-sm text-gray-500">Ledger & Payout Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Deliveries</p>
          <p className="text-2xl font-black text-gray-900">{stats.totalDeliveries || deliveries.length || 0}</p>
        </div>
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gross Payout</p>
          <p className="text-2xl font-black text-gray-900">?{Number(stats.totalEarnings || 0).toFixed(2)}</p>
        </div>
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Paid</p>
          <p className="text-2xl font-black text-green-600">?{Number(stats.paidAmount || 0).toFixed(2)}</p>
        </div>
        <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-black text-red-600">?{Number(stats.pendingAmount || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Delivery Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Order ID</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Base Pay</th>
                <th className="p-4 font-bold">Dist. Pay</th>
                <th className="p-4 font-bold text-right">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No deliveries found in this period.</td>
                </tr>
              ) : (
                deliveries.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-xs">{d.orderNumber || d.orderId?.slice(0, 8)}</td>
                    <td className="p-4 text-gray-500">{d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : '-'}</td>
                    <td className="p-4 text-gray-900">?{Number(d.basePayout || 0).toFixed(2)}</td>
                    <td className="p-4 text-gray-900">?{Number(d.distancePayout || 0).toFixed(2)}</td>
                    <td className="p-4 text-purple-700 font-bold text-right">?{Number(d.totalEarning || 0).toFixed(2)}</td>
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
