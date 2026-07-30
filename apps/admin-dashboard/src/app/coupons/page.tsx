'use client';

import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Percent } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  isActive: boolean;
  validTill: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: 'cp-1',
      code: 'WELCOME50',
      discountType: 'FLAT',
      discountValue: 50,
      minOrderAmount: 200,
      maxDiscountAmount: 50,
      isActive: true,
      validTill: '2026-12-31',
    },
    {
      id: 'cp-2',
      code: 'FOODHUB20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 300,
      maxDiscountAmount: 100,
      isActive: true,
      validTill: '2026-12-31',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');
  const [discountValue, setDiscountValue] = useState(50);
  const [minOrder, setMinOrder] = useState(200);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    const newCoupon: Coupon = {
      id: `cp-${Date.now()}`,
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrder),
      maxDiscountAmount: discountType === 'PERCENTAGE' ? 100 : Number(discountValue),
      isActive: true,
      validTill: '2026-12-31',
    };
    setCoupons([newCoupon, ...coupons]);
    setCode('');
    setShowModal(false);
  };

  const toggleStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Coupon Management</h1>
          <p className="text-xs text-gray-500">Create & manage promotional promo codes across FoodHub</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Create Promo Code
        </button>
      </div>

      {/* Coupon List Table */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Promo Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Min Order</th>
                <th className="px-6 py-4">Valid Till</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-black text-gray-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-600" />
                    <span>{c.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    {c.discountType === 'FLAT' ? `₹${c.discountValue} FLAT` : `${c.discountValue}% OFF`}
                  </td>
                  <td className="px-6 py-4">₹{c.minOrderAmount}</td>
                  <td className="px-6 py-4">{c.validTill}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(c.id)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.isActive ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      <span>{c.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => deleteCoupon(c.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-black text-gray-900">New Promo Code</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE100"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl bg-gray-100 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-orange-700"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
