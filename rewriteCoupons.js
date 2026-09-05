const fs = require('fs');
const file = 'apps/admin-dashboard/src/app/coupons/page.tsx';
const newContent = `'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Tag, CheckCircle2, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { adminFetch } from '../../utils/admin-fetch';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { accessToken } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountVal, setDiscountVal] = useState('');
  const [couponType, setCouponType] = useState('PERCENTAGE');

  const fetchCoupons = async () => {
    try {
      const data = await adminFetch('/coupons/admin', {
        headers: { Authorization: \`Bearer \${accessToken}\` }
      });
      setCoupons(data);
    } catch {
      // error
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountVal.trim()) return;
    
    try {
      await adminFetch('/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${accessToken}\`
        },
        body: JSON.stringify({
          code: code.trim(),
          couponType: couponType,
          discountVal: Number(discountVal),
          validFrom: new Date().toISOString(),
          validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usageLimit: 1000,
          minOrderVal: 0
        })
      });
      fetchCoupons();
      setCode('');
      setDiscountVal('');
      setShowModal(false);
    } catch (err) {
      alert('Failed to add coupon. Code might already exist.');
      console.error(err);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await adminFetch(\`/coupons/\${id}/deactivate\`, {
        method: 'PATCH',
        headers: { Authorization: \`Bearer \${accessToken}\` }
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Discount Coupons
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Manage discount codes, promo offers, and track usage.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Coupon</span>
        </button>
      </div>

      {!isLoaded ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-xs font-bold text-gray-400">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center space-y-3">
          <Tag className="mx-auto h-12 w-12 text-gray-300" />
          <p className="text-base font-bold text-gray-700">No coupons exist</p>
          <p className="text-xs text-gray-400">
            Click &quot;Add Coupon&quot; to create a discount.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-black text-gray-900 font-mono tracking-widest">{c.code}</h3>
                  {c.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDeactivate(c.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-[10px] font-bold"
                      title="Deactivate"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  {c.couponType === 'PERCENTAGE' ? \`\${c.discountVal}% OFF\` : \`FLAT ₹\${c.discountVal} OFF\`}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                {c.status === 'ACTIVE' ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-xl">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-xl">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Add New Coupon</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE50"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-purple-500 focus:bg-white focus:outline-none min-h-[44px]"
                  />
                </div>
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
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync(file, newContent);
console.log('Rewrite admin coupons complete');
