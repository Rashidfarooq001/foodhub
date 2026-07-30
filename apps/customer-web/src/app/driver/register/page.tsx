'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bike, User, MapPin, CreditCard, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DriverRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    licenseNumber: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/drivers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed. Please check form details.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Application Submitted!</h1>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 text-sm text-emerald-900 space-y-2">
          <p className="font-bold">Application Status: <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-900">PENDING ADMIN APPROVAL</span></p>
          <p className="text-xs text-emerald-700">
            Thank you for applying to join the FoodHub Delivery Fleet. Our onboarding team will verify your driving license and RC. Once approved, you can log in to your Delivery Dashboard to receive trips.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-gray-800"
        >
          Return to FoodHub Home <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <Bike className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Join FoodHub Delivery Fleet</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Earn competitive payouts, weekly bonuses, and flexible duty hours delivering meals in your city
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-center justify-between gap-4">
        <div>
          <span className="font-bold block">Already created by Super Admin?</span>
          <span className="text-blue-700">Admin-onboarded drivers do not need to register. You can log in directly using your assigned credentials.</span>
        </div>
        <a
          href="http://localhost:3002/login"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
        >
          Courier Login
        </a>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Info */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <User className="h-5 w-5 text-emerald-600" /> 1. Personal &amp; Account Details
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Create Password *</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Secure password for login"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Vehicle & Driving License */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <FileText className="h-5 w-5 text-emerald-600" /> 2. Vehicle &amp; Driving License
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Type</label>
              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City / Area</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Indiranagar, Bengaluru"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Bank Details */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <CreditCard className="h-5 w-5 text-emerald-600" /> 3. Payout Bank Account Details
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="State Bank of India"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                value={form.ifsc}
                onChange={handleChange}
                placeholder="SBIN0001234"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-700 disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Submitting Application...' : 'Submit Delivery Partner Registration'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
