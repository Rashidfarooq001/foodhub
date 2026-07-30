'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bike, User, FileText, CreditCard, CheckCircle2 } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const getApiBase = () => (typeof window !== 'undefined' ? getApiBaseUrl() : 'https://foodhub-backend-enq2.onrender.com/api/v1');

export default function AddDriverPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    licenseNumber: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    address: '',
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_admin_token') : null;
      const res = await fetch(`${getApiBase()}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/delivery-partners');
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to onboard delivery partner');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Delivery Fleet
          </button>
          <h1 className="text-3xl font-black text-gray-900">Onboard Delivery Partner</h1>
          <p className="text-xs text-gray-500">Directly create courier account with active duty status</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500 p-4 text-white shadow-lg font-bold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Delivery partner onboarded successfully! Account activated. Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <User className="h-5 w-5 text-purple-600" /> 1. Personal Credentials
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Vikram Singh"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+919876500999"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="driver@foodhub.com"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="DriverPass123!"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Vehicle & License */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <Bike className="h-5 w-5 text-purple-600" /> 2. Vehicle &amp; Driving License
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Driving License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                required
                value={form.licenseNumber}
                onChange={handleChange}
                placeholder="DL-918273645019"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Type</label>
              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              >
                <option value="BIKE">Motorcycle / Bike</option>
                <option value="SCOOTER">Scooter</option>
                <option value="ELECTRIC_BIKE">EV Two Wheeler</option>
                <option value="BICYCLE">Bicycle</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Registration Number</label>
              <input
                type="text"
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleChange}
                placeholder="KA-01-AB-1234"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Operating City / Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Bengaluru, Karnataka"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <CreditCard className="h-5 w-5 text-purple-600" /> 3. Payout Bank Details
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="98765432101"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                value={form.ifsc}
                onChange={handleChange}
                placeholder="HDFC0001234"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID</label>
              <input
                type="text"
                name="upiId"
                value={form.upiId}
                onChange={handleChange}
                placeholder="driver@upi"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-sm font-black text-white shadow-xl shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Onboarding Partner...' : 'Create & Activate Delivery Partner'}
        </button>
      </form>
    </div>
  );
}
