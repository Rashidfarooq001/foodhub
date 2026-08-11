'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bike, User, MapPin, CreditCard, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { MediaUploader } from '../../../components/common/MediaUploader';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DriverRegisterPage() {
  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Bike className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Registration Temporarily Disabled</h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Courier partner registration screens are temporarily hidden during active development.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800"
            >
              <span>Return to FoodHub Home</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    licenseNumber: '',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: '',
    address: '',
    licenseUrl: '',
    rcUrl: '',
    idProofUrl: '',
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
            Thank you for registering with FoodHub. Our team will review your application and reach you within 24 hours.
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
        <h1 className="text-3xl font-black text-gray-900">Become a Delivery Partner</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Earn competitive payouts per delivery with weekly settlements and flexible working hours
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-600">
            {error}
          </div>
        )}

        {/* Step 1: Personal Information */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <User className="h-5 w-5 text-emerald-600" /> 1. Personal Details
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
                placeholder="Ramesh Kumar"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+919876543210"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="driver@example.com"
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

        {/* Step 2: Vehicle & Driving License Documents */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <FileText className="h-5 w-5 text-emerald-600" /> 2. Vehicle &amp; Verification Documents
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
                <option value="MOTORCYCLE">Motorcycle / Bike</option>
                <option value="SCOOTER">Scooter</option>
                <option value="EV_SCOOTER">EV Two Wheeler</option>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 pt-2">
            <MediaUploader
              label="Driving License Photo/PDF *"
              acceptType="any"
              value={form.licenseUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, licenseUrl: url }))}
            />
            <MediaUploader
              label="Vehicle RC Photo/PDF *"
              acceptType="any"
              value={form.rcUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, rcUrl: url }))}
            />
            <MediaUploader
              label="Aadhaar / ID Proof Document *"
              acceptType="any"
              value={form.idProofUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, idProofUrl: url }))}
            />
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
