'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Tag, CheckCircle2, Trash2, X, Edit3 } from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { adminFetch } from '../../utils/admin-fetch';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { accessToken } = useAdminAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [code, setCode] = useState('');
  const [discountVal, setDiscountVal] = useState('');
  const [couponType, setCouponType] = useState('PERCENTAGE');

  const fetchCoupons = async () => {
    try {
      const res = await adminFetch('/coupons/admin', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setCoupons(data);
    } catch {
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setCode('');
    setDiscountVal('');
    setCouponType('PERCENTAGE');
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setCode(c.code);
    setDiscountVal(String(c.discountVal));
    setCouponType(c.couponType);
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountVal.trim()) return;
    
    try {
      if (editId) {
        await adminFetch(`/coupons/${editId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
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
      } else {
        await adminFetch('/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
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
      }
      fetchCoupons();
      setShowModal(false);
    } catch (err) {
      alert('Failed to save coupon.');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await adminFetch(`/coupons/${id}/hard`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await adminFetch(`/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
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
          onClick={openAdd}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Coupon</span>
        </button>
      </div>

      {!isLoaded ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm font-bold text-gray-400">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">No Coupons Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mb-6">
            Create discount codes to run promotional campaigns and attract more orders.
          </p>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-6 py-3 text-xs font-black text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-widest uppercase">{c.code}</h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    {c.couponType === 'FLAT' ? `FLAT ₹${c.discountVal} OFF` : `${c.discountVal}% OFF`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-[10px] font-bold text-gray-400 hover:text-blue-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-[10px] font-bold text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="border-t border-dashed border-gray-200 my-4"></div>
              
              <div className="flex items-center justify-between">
                {c.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                    INACTIVE
                  </span>
                )}

                {c.status === 'ACTIVE' && (
                  <button 
                    onClick={() => handleDeactivate(c.id)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">{editId ? 'Edit Coupon' : 'Create Discount Coupon'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME50"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Type *</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    placeholder={couponType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 150'}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-xs font-black text-white hover:bg-purple-700 transition shadow-md shadow-purple-500/20"
                >
                  {editId ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
