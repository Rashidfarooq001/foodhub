'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Store, MapPin, CreditCard, CheckCircle2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { MediaUploader } from '../../../components/common/MediaUploader';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

const IS_AUTH_TEMPORARILY_DISABLED = true;

export default function RestaurantRegisterPage() {
  if (IS_AUTH_TEMPORARILY_DISABLED) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Registration Temporarily Disabled</h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Restaurant onboarding registration screens are temporarily hidden during active development.
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
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    description: '',
    gstin: '',
    fssaiLicense: '',
    logoUrl: '',
    bannerUrl: '',
    promoVideoUrl: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pin: '560038',
    cuisines: 'North Indian, Biryani',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cuisines: form.cuisines.split(',').map((c) => c.trim()),
        }),
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
            Thank you for applying to partner with FoodHub. Our operations team will verify your FSSAI license and bank details. Once approved, you can log in to your Merchant Dashboard.
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <UtensilsCrossed className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Partner With FoodHub</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Expand your restaurant reach, get instant online orders, and manage kitchen operations seamlessly
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-center justify-between gap-4">
        <div>
          <span className="font-bold block">Already created by Super Admin?</span>
          <span className="text-blue-700">Admin-onboarded restaurants do not need to register. You can log in directly using your assigned credentials.</span>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_HOTEL_DASHBOARD_URL || 'http://localhost:3001'}/login`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
        >
          Merchant Login
        </a>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Restaurant Info */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <Store className="h-5 w-5 text-orange-600" /> 1. Restaurant &amp; Owner Profile
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Restaurant Name *</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Royal Biryani House"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Full Name *</label>
              <input
                type="text"
                name="ownerName"
                required
                value={form.ownerName}
                onChange={handleChange}
                placeholder="Owner name"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Email *</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="owner@restaurant.com"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Phone *</label>
              <input
                type="text"
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+919876543210"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
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
                placeholder="Password for login"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">FSSAI License Number *</label>
              <input
                type="text"
                name="fssaiLicense"
                required
                value={form.fssaiLicense}
                onChange={handleChange}
                placeholder="14-digit FSSAI No."
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Address & Business */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <MapPin className="h-5 w-5 text-orange-600" /> 2. Store Location &amp; Cuisines
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Street Address *</label>
              <input
                type="text"
                name="address"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="Door No, Street Name, Area"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cuisines Offered</label>
              <input
                type="text"
                name="cuisines"
                value={form.cuisines}
                onChange={handleChange}
                placeholder="North Indian, Chinese, Fast Food"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Restaurant Media & Brand Assets */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <ImageIcon className="h-5 w-5 text-orange-600" /> 3. Store Brand Assets &amp; Promotional Video
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <MediaUploader
              label="Restaurant Logo (JPG, PNG, WEBP max 5MB)"
              acceptType="image"
              value={form.logoUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
            />
            <MediaUploader
              label="Storefront / Cover Banner Image (max 5MB)"
              acceptType="image"
              value={form.bannerUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, bannerUrl: url }))}
            />
            <div className="sm:col-span-2">
              <MediaUploader
                label="Promotional Restaurant Video (MP4, MOV, WEBM max 100MB)"
                acceptType="video"
                value={form.promoVideoUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, promoVideoUrl: url }))}
              />
            </div>
          </div>
        </div>

        {/* Step 4: Bank Details */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <CreditCard className="h-5 w-5 text-orange-600" /> 4. Settlement Bank Details
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="HDFC Bank"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="918273645019"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID</label>
              <input
                type="text"
                name="upiId"
                value={form.upiId}
                onChange={handleChange}
                placeholder="merchant@upi"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Submitting Application...' : 'Submit Restaurant Registration Application'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
