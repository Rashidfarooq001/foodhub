'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, Store, CreditCard, CheckCircle2, DollarSign, User, Image as ImageIcon } from 'lucide-react';
import { MediaUploader } from '../../../components/common/MediaUploader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AddRestaurantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [form, setForm] = useState({
    // Restaurant Details
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    description: '',
    gstin: '',
    fssaiLicense: '',

    // Address
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    pin: '560038',
    address: '',

    // Business
    cuisines: 'North Indian, Biryani',
    openingHours: '09:00',
    closingHours: '23:00',
    deliveryRadius: '7.5',
    packagingFee: '15',
    deliveryFee: '35',
    minOrder: '199',

    // Media
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',

    // Bank Details
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        description: form.description,
        gstin: form.gstin,
        fssaiLicense: form.fssaiLicense,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pin: form.pin,
        cuisines: form.cuisines.split(',').map((c) => c.trim()),
        openingHours: form.openingHours,
        closingHours: form.closingHours,
        deliveryRadius: parseFloat(form.deliveryRadius) || 5,
        packagingFee: parseFloat(form.packagingFee) || 15,
        deliveryFee: parseFloat(form.deliveryFee) || 30,
        minOrder: parseFloat(form.minOrder) || 100,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
        upiId: form.upiId,
      };

      const token = typeof window !== 'undefined' ? localStorage.getItem('foodhub_admin_token') : null;

      const res = await fetch(`${API_BASE}/api/v1/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/restaurants');
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to onboard restaurant');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Restaurants
          </button>
          <h1 className="text-3xl font-black text-gray-900">Onboard New Restaurant</h1>
          <p className="text-xs text-gray-500">Add store details, merchant account credentials &amp; settlement bank info</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500 p-4 text-white shadow-lg font-bold text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Restaurant onboarded successfully! Owner account created. Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Restaurant Details */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <Store className="h-5 w-5 text-purple-600" /> 1. Restaurant &amp; Owner Profile
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
                placeholder="e.g. Royal Punjab Express"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
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
                placeholder="e.g. Vikram Sethi"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Password *</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Secure password for merchant login"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
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
                placeholder="14-digit FSSAI License No."
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                name="gstin"
                value={form.gstin}
                onChange={handleChange}
                placeholder="29ABCDE1234F1Z5"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short tagline or specialty"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <MapPin className="h-5 w-5 text-purple-600" /> 2. Physical Address
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Street Address *</label>
              <input
                type="text"
                name="address"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="Building No, Street, Locality"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code</label>
              <input
                type="text"
                name="pin"
                value={form.pin}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Business & Operations */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <DollarSign className="h-5 w-5 text-purple-600" /> 3. Business &amp; Operations Rules
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Cuisines (Comma Separated)</label>
              <input
                type="text"
                name="cuisines"
                value={form.cuisines}
                onChange={handleChange}
                placeholder="North Indian, Chinese, Fast Food"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Opening Hours</label>
              <input
                type="text"
                name="openingHours"
                value={form.openingHours}
                onChange={handleChange}
                placeholder="09:00"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Closing Hours</label>
              <input
                type="text"
                name="closingHours"
                value={form.closingHours}
                onChange={handleChange}
                placeholder="23:00"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Radius (km)</label>
              <input
                type="text"
                name="deliveryRadius"
                value={form.deliveryRadius}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Packaging Fee (₹)</label>
              <input
                type="text"
                name="packagingFee"
                value={form.packagingFee}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Base Delivery Fee (₹)</label>
              <input
                type="text"
                name="deliveryFee"
                value={form.deliveryFee}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Order Value (₹)</label>
              <input
                type="text"
                name="minOrder"
                value={form.minOrder}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Media & Bank Details */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <CreditCard className="h-5 w-5 text-purple-600" /> 4. Media &amp; Settlement Bank Info
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MediaUploader
                label="Restaurant Logo Image (JPG, PNG, WEBP max 5MB)"
                acceptType="image"
                value={form.logoUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
              />
              <MediaUploader
                label="Restaurant Banner Image (JPG, PNG, WEBP max 5MB)"
                acceptType="image"
                value={form.bannerUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, bannerUrl: url }))}
              />
            </div>

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
                placeholder="918273645019"
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
                placeholder="merchant@upi"
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
          {isSubmitting ? 'Onboarding Restaurant...' : 'Create & Publish Restaurant'}
        </button>
      </form>
    </div>
  );
}
