'use client';

import React, { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle, X, Percent, DollarSign } from 'lucide-react';

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
      code: 'ZAYKA20',
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
    if (!code.trim()) return;
    const newCoupon: Coupon = {
      id: `cp-${Date.now()}`,
      code: code.trim().toUpperCase(),
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
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Platform Coupons &amp; Campaigns
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Create promotional voucher codes, discount thresholds &amp; customer campaign rules
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Coupon List (Dual Mobile Card / Desktop Table) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900">
          Active Promo Campaigns ({coupons.length})
        </h2>

        {coupons.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No active coupons configured.
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block md:hidden space-y-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Tag className="h-4 w-4" />
                      </div>
                      <span className="font-black text-sm text-gray-900 tracking-wider">
                        {c.code}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleStatus(c.id)}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase border transition min-h-[32px] ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {c.isActive ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>{c.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">
                        Discount
                      </span>
                      <span className="font-black text-purple-700">
                        {c.discountType === 'FLAT'
                          ? `₹${c.discountValue} FLAT`
                          : `${c.discountValue}% OFF`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">
                        Min Order
                      </span>
                      <span className="font-bold text-gray-800">₹{c.minOrderAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-400 text-[10px]">Valid till {c.validTill}</span>
                    <button
                      onClick={() => deleteCoupon(c.id)}
                      className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 min-h-[36px] flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Promo Code</th>
                    <th className="pb-3">Discount</th>
                    <th className="pb-3">Min Order</th>
                    <th className="pb-3">Valid Till</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-black text-gray-900 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-purple-600" />
                        <span>{c.code}</span>
                      </td>
                      <td className="py-3 font-bold text-purple-700">
                        {c.discountType === 'FLAT'
                          ? `₹${c.discountValue} FLAT`
                          : `${c.discountValue}% OFF`}
                      </td>
                      <td className="py-3 text-gray-700">₹{c.minOrderAmount}</td>
                      <td className="py-3 text-gray-500">{c.validTill}</td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {c.isActive ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span>{c.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3 text-right">
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
          </>
        )}
      </div>

      {/* Modal / Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">New Promo Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE100"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-purple-600 hover:bg-purple-700 py-3 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
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
