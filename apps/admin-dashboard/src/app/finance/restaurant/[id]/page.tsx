'use client';

import { formatCurrency } from '@foodhub/utils';
import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../../../utils/admin-fetch';
import { ArrowLeft, Store, CheckCircle, Clock, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function fmt(dt: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!dt) return 'N/A';
  return new Date(dt).toLocaleString('en-IN', opts || {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function RestaurantFinanceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [period, setPeriod] = useState('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, period]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch(`/settlements/restaurant/${id}/detail?periodType=${period}`);
      if (!res.ok) throw new Error('Failed to load restaurant details');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!data) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await adminFetch(`/settlements/restaurant/${id}/record-payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: 'MANUAL', transactionReference: 'MANUAL_DASHBOARD', periodType: period }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Payment failed');
      await fetchDetails();
    } catch (err: any) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleViewInvoice = async () => {
    if (!data) return;
    setInvoiceLoading(true);
    setInvoiceModal({ loading: true });
    try {
      const res = await adminFetch(`/settlements/restaurant/${id}/invoice?periodType=${period}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Invoice not found');
      setInvoiceModal({ loading: false, invoice: json });
    } catch (err: any) {
      setInvoiceModal({ loading: false, error: err.message });
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading restaurant settlements...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-gray-500">No data found</div>;

  const restaurant = data.restaurant || {};
  const ws = data.weeklySettlement || {};
  const orders = (data.orders || []);
  const isPaid = ws.status === 'PAID';

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Invoice Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Settlement Invoice</h3>
              <button onClick={() => setInvoiceModal(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X size={22} />
              </button>
            </div>
            {invoiceModal.loading ? (
              <div className="py-12 text-center text-slate-500">Loading invoice...</div>
            ) : invoiceModal.error ? (
              <div className="py-12 text-center text-red-500">{invoiceModal.error}</div>
            ) : invoiceModal.invoice ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-slate-500 mb-1">Invoice Number</div>
                    <div className="font-black text-slate-900 font-mono">{invoiceModal.invoice.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Restaurant</div>
                    <div className="font-bold text-slate-900">{invoiceModal.invoice.restaurantName}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Settlement Period</div>
                    <div className="font-bold text-slate-900">
                      {new Date(invoiceModal.invoice.periodStart).toLocaleDateString('en-IN')} &ndash; {new Date(invoiceModal.invoice.periodEnd).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Invoice Date</div>
                    <div className="font-bold text-slate-900">{fmt(invoiceModal.invoice.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Payment Method</div>
                    <div className="font-bold text-slate-900">{invoiceModal.invoice.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Payment Date</div>
                    <div className="font-bold text-slate-900">{fmt(invoiceModal.invoice.paymentDate)}</div>
                  </div>
                </div>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      <tr><td className="px-4 py-3 text-slate-700">Gross Sales</td><td className="px-4 py-3 text-right">{formatCurrency(invoiceModal.invoice.grossAmount)}</td></tr>
                      <tr><td className="px-4 py-3 text-slate-500 pl-8">- Commission</td><td className="px-4 py-3 text-right text-red-600">-{formatCurrency(invoiceModal.invoice.commissionAmount)}</td></tr>
                      <tr><td className="px-4 py-3 text-slate-500 pl-8">- GST on Commission (18%)</td><td className="px-4 py-3 text-right text-red-600">-{formatCurrency(invoiceModal.invoice.commissionGst)}</td></tr>
                      <tr className="bg-slate-50">
                        <td className="px-4 py-4 font-black text-slate-900">Net Payable</td>
                        <td className="px-4 py-4 font-black text-right text-green-600 text-lg">{formatCurrency(invoiceModal.invoice.netPayable)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-700">Amount Paid</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(invoiceModal.invoice.paidAmount)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-700">Pending</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(invoiceModal.invoice.pendingAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center bg-green-50 text-green-800 px-4 py-3 rounded-lg font-bold border border-green-100">
                  <div className="flex items-center gap-2"><CheckCircle size={20} />PAID</div>
                  <button onClick={() => window.print()} className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">Print / PDF</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        <Link href="/settlements" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-purple-600" />
            {restaurant.name || 'Restaurant'}
          </h1>
          <p className="text-sm text-gray-500">Ledger &amp; Settlement Details</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-600 text-sm"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="current">Last 7 Days</option>
          <option value="monthly">Last 30 Days</option>
        </select>
      </div>

      {/* WEEKLY SETTLEMENT SECTION — authoritative single source of truth */}
      <div className="rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Weekly Settlement
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(ws.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' '}&ndash;{' '}
              {new Date(ws.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-black tracking-wide ${isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {ws.status || 'PENDING'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Orders</p>
            <p className="text-2xl font-black text-gray-900">{ws.orderCount || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Gross Sales</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(ws.grossSales || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
            <p className="text-xs font-bold text-purple-400 uppercase mb-1">Net Payable</p>
            <p className="text-2xl font-black text-purple-700">{formatCurrency(ws.netPayable || 0)}</p>
          </div>
          <div className={`rounded-2xl p-4 border shadow-sm ${isPaid ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
            <p className={`text-xs font-bold uppercase mb-1 ${isPaid ? 'text-green-500' : 'text-amber-500'}`}>
              {isPaid ? 'Amount Paid' : 'Pending'}
            </p>
            <p className={`text-2xl font-black ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
              {isPaid ? formatCurrency(ws.paidAmount || 0) : formatCurrency(ws.pendingAmount || 0)}
            </p>
          </div>
        </div>

        {/* Deduction breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm space-y-2">
          <div className="flex justify-between text-gray-600"><span>Gross Sales</span><span className="font-medium">{formatCurrency(ws.grossSales || 0)}</span></div>
          <div className="flex justify-between text-red-500"><span>- Commission ({ws.orderCount} orders)</span><span>-{formatCurrency(ws.commissionAmount || 0)}</span></div>
          <div className="flex justify-between text-red-500"><span>- GST on Commission (18%)</span><span>-{formatCurrency(ws.commissionGst || 0)}</span></div>
          <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100 text-base"><span>Net Payable</span><span className="text-purple-700">{formatCurrency(ws.netPayable || 0)}</span></div>
          {(ws.paidAmount > 0) && <div className="flex justify-between text-green-600"><span>Paid</span><span className="font-bold">{formatCurrency(ws.paidAmount || 0)}</span></div>}
          {(ws.pendingAmount > 0) && <div className="flex justify-between text-red-600"><span>Pending</span><span className="font-bold">{formatCurrency(ws.pendingAmount || 0)}</span></div>}
        </div>

        {/* Payment details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Payment Status</p>
            <p className={`font-black ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>{ws.status || 'PENDING'}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Payment Method</p>
            <p className="font-bold text-gray-800">{ws.paymentMethod || <span className="text-gray-400">Not Paid</span>}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Payment Date</p>
            <p className="font-bold text-gray-800">
              {ws.paymentDate ? fmt(ws.paymentDate) : <span className="text-gray-400">Not Paid</span>}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Invoice</p>
            {ws.invoiceNumber ? (
              <button onClick={handleViewInvoice} className="font-mono font-bold text-purple-600 hover:underline text-xs">{ws.invoiceNumber}</button>
            ) : (
              <span className="text-gray-400">Not Generated</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {payError && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">{payError}</div>}
        <div className="flex gap-3">
          {!isPaid && (ws.pendingAmount || 0) > 0 && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-sm disabled:opacity-50 transition flex items-center gap-2"
            >
              {paying ? 'Processing...' : `PAY ${formatCurrency(ws.pendingAmount || 0)}`}
            </button>
          )}
          {isPaid && ws.invoiceNumber && (
            <button
              onClick={handleViewInvoice}
              disabled={invoiceLoading}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition flex items-center gap-2"
            >
              <FileText size={16} />
              {invoiceLoading ? 'Loading...' : 'VIEW INVOICE'}
            </button>
          )}
          {isPaid && !ws.invoiceNumber && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
              <CheckCircle size={16} />
              Settlement fully paid
            </div>
          )}
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Order Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">Sorted by order date, latest first</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">ORDER ID</th>
                <th className="p-4 font-bold">DATE</th>
                <th className="p-4 font-bold">GROSS</th>
                <th className="p-4 font-bold">COMMISSION</th>
                <th className="p-4 font-bold">GST ON COMMISSION</th>
                <th className="p-4 font-bold text-right">NET PAYOUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No orders found in this period.</td></tr>
              ) : (
                orders.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-xs">{o.orderNumber || o.orderId?.slice(0, 8)}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {o.orderDate ? (
                        <>
                          <div>{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-gray-400">{new Date(o.orderDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-900">{formatCurrency(Number(o.totalAmount || 0))}</td>
                    <td className="p-4 text-red-600">-{formatCurrency(Number(o.commissionAmount || 0))}</td>
                    <td className="p-4 text-red-600">-{formatCurrency(Number(o.commissionGst || 0))}</td>
                    <td className="p-4 text-purple-700 font-bold text-right">{formatCurrency(Number(o.netPayable || 0))}</td>
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