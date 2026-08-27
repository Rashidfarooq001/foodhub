'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../stores/use-auth-store';
import { FileText, Printer, CheckCircle, Store, User } from 'lucide-react';

export default function InvoicePage() {
  const params = useParams();
  const orderId = params.id as string;
  const accessToken = useAuthStore((s) => (s as any).accessToken);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken || !orderId) return;

    fetch(`${backendUrl}/orders/${orderId}/invoice`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load invoice');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderId, accessToken]);

  if (loading) return <div className="p-10 text-center text-gray-500 font-bold">Loading Authorized Invoice...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!data) return null;

  const { invoiceDetails, customerInvoice, restaurantStatement, items, parties } = data;

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-5 px-4 sm:px-4 lg:px-5 font-sans">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Header / Actions */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900">ZaykaFood Financial Record</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Invoice: {invoiceDetails.invoiceNumber}</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>

        {/* Status Banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <div>
            <div className="font-bold text-emerald-900">Payment {invoiceDetails.paymentStatus}</div>
            <div className="text-xs text-emerald-700">Order is {invoiceDetails.status}. Generated from immutable pricing snapshot.</div>
          </div>
        </div>

        {/* Grid: Customer vs Restaurant */}
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* CUSTOMER INVOICE */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center gap-3">
              <User className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="font-black text-blue-900">{customerInvoice.title}</h2>
                <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Bill to: {parties.customer.name}</p>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-500">Food Subtotal</td>
                    <td className="font-bold text-gray-900">₹{customerInvoice.foodSubtotal.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-500">Taxes</td>
                    <td className="font-bold text-gray-900">₹{customerInvoice.taxes.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-500">Delivery Fee</td>
                    <td className="font-bold text-gray-900">₹{customerInvoice.deliveryFee.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-900 font-bold flex items-center gap-2">
                      Platform Fee <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black tracking-wider">Customer Charge</span>
                    </td>
                    <td className="font-bold text-blue-700">₹{customerInvoice.platformFee.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-3 mt-2 border-t-2 border-gray-100">
                    <td className="font-black text-gray-900 uppercase">Total Paid</td>
                    <td className="font-black text-xl text-gray-900">₹{customerInvoice.totalPaid.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg p-3 italic">
                * Note: The Platform Fee is collected directly from the customer by FoodHub and is not part of the restaurant settlement.
              </div>
            </div>
          </div>

          {/* RESTAURANT SETTLEMENT */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-purple-50 border-b border-purple-100 px-4 py-3 flex items-center gap-3">
              <Store className="w-5 h-5 text-purple-700" />
              <div>
                <h2 className="font-black text-purple-900">{restaurantStatement.title}</h2>
                <p className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Merchant: {parties.restaurant.name}</p>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-900 font-bold">Gross Eligible Sales</td>
                    <td className="font-black text-gray-900">₹{restaurantStatement.grossSales.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-500">Commission ({restaurantStatement.commissionRate}%)</td>
                    <td className="font-bold text-red-600">-₹{restaurantStatement.commissionDeduction.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-500">GST on Commission (18%)</td>
                    <td className="font-bold text-red-600">-₹{restaurantStatement.commissionGstDeduction.toFixed(2)}</td>
                  </tr>
                  <tr className="flex justify-between py-2">
                    <td className="text-gray-400 line-through">Customer Platform Fee</td>
                    <td className="font-bold text-gray-400">₹0.00</td>
                  </tr>
                  <tr className="flex justify-between py-3 mt-2 border-t-2 border-gray-100 bg-emerald-50/50 -mx-6 px-4">
                    <td className="font-black text-emerald-900 uppercase">Net Payable</td>
                    <td className="font-black text-xl text-emerald-700">₹{restaurantStatement.netPayable.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg p-3 italic">
                * Note: Platform fee is strictly excluded from restaurant deductions per ZaykaFood financial rules.
              </div>
            </div>
          </div>

        </div>

        {/* Items Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> Order Items Detail
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Item Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
