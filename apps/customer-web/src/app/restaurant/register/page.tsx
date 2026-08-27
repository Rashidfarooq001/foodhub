'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Store, MapPin, CreditCard, CheckCircle2, ArrowRight, FileText, Image as ImageIcon, Navigation } from 'lucide-react';
import { MediaUploader } from '../../../components/common/MediaUploader';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function RestaurantRegisterPage() {
  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800"
            >
              <span>Return to ZaykaFood Home</span>
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
    fssaiUrl: '',
    panNumber: '',
    panUrl: '',
    menuUrl: '',
    logoUrl: '',
    bannerUrl: '',
    promoVideoUrl: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pin: '',
    latitude: null as number | null,
    longitude: null as number | null,
    cuisines: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);

  const { status: gpsStatus, error: gpsError, requestLocation } = useGeolocation();
  const isLocatingOwner = gpsStatus === 'requesting';

  const handleGetOwnerLocation = async () => {
    setLocationStatusMsg('Acquiring real-time GPS coordinates...');
    const res = await requestLocation();
    
    if (res) {
      const { coords, address } = res;
      setForm((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
      
      const addrText = address.formattedAddress || address.address || address.displayName || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      if (addrText && !form.address) {
        setForm((prev) => ({ ...prev, address: addrText }));
      }
      
      setLocationStatusMsg(`GPS captured successfully: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    } else {
      setLocationStatusMsg(gpsError || 'Failed to detect location.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const cleanDigits = form.phone.replace(/\D/g, '');
    const rawDigits = cleanDigits.startsWith('91') && cleanDigits.length === 12
      ? cleanDigits.substring(2)
      : cleanDigits;

    if (rawDigits.length !== 10 || !/^[6-9]\d{9}$/.test(rawDigits)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Build payload: omit null lat/lng entirely so @IsNumber()/@IsOptional() works
      // JSON.stringify drops keys with undefined values
      const cuisineList = form.cuisines.trim()
        ? form.cuisines.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const payload: Record<string, unknown> = {
        ...form,
        phone: rawDigits,
        cuisines: cuisineList,
        latitude: form.latitude != null ? form.latitude : undefined,
        longitude: form.longitude != null ? form.longitude : undefined,
        // Omit empty optional strings so backend @IsEmail/@IsString validators don't fail
        gstin: form.gstin.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifsc: form.ifsc.trim() || undefined,
        upiId: form.upiId.trim() || undefined,
        country: form.country.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        const msg = Array.isArray(data.message)
          ? data.message.join(' • ')
          : data.message || 'Registration failed. Please check form details.';
        setError(msg);
      }
    } catch {
      setError('Unable to connect to server. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Application Submitted!</h1>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900 space-y-2">
          <p className="font-bold">Application Status: <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-900">PENDING ADMIN APPROVAL</span></p>
          <p className="text-xs text-emerald-700">
            Thank you for applying to partner with ZaykaFood. Our operations team will verify your FSSAI license and bank details. Once approved, you can log in to your Merchant Dashboard.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-xs font-bold text-white shadow-lg hover:bg-gray-800"
        >
          Return to ZaykaFood Home <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-4 lg:px-5 space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Store className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Partner with ZaykaFood</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Expand your restaurant business with thousands of online orders every day
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-600">
            {error}
          </div>
        )}

        {/* Step 1: Restaurant Info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <Store className="h-5 w-5 text-orange-600" /> 1. Restaurant &amp; Owner Details
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
                placeholder="Spice Garden Restaurant"
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
                placeholder="Ananya Verma"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Mobile Number *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-black text-gray-500 border-r border-gray-200 pr-2">+91</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm((prev) => ({ ...prev, phone: clean }));
                  }}
                  placeholder="7006298759"
                  className="w-full rounded-2xl border border-gray-200 py-2.5 pl-14 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="ananya@example.com"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Create Account Password *</label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Password for logging into Merchant Dashboard"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Licenses & Legal Compliance Documents */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <FileText className="h-5 w-5 text-orange-600" /> 2. Licenses &amp; Compliance Verification Documents
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">FSSAI License Number *</label>
              <input
                type="text"
                name="fssaiLicense"
                required
                value={form.fssaiLicense}
                onChange={handleChange}
                placeholder="14-digit FSSAI License No"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                name="gstin"
                value={form.gstin}
                onChange={handleChange}
                placeholder="29ABCDE1234F1Z5"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">PAN Card Number</label>
              <input
                type="text"
                name="panNumber"
                value={form.panNumber}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
            <MediaUploader
              label="FSSAI License Certificate Document *"
              acceptType="any"
              value={form.fssaiUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, fssaiUrl: url }))}
            />
            <MediaUploader
              label="PAN Card Document *"
              acceptType="any"
              value={form.panUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, panUrl: url }))}
            />
            <MediaUploader
              label="Restaurant Menu Card / Catalog *"
              acceptType="any"
              value={form.menuUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, menuUrl: url }))}
            />
          </div>
        </div>

        {/* Step 3: Store Physical Location & GPS Geolocation */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <MapPin className="h-5 w-5 text-orange-600" /> 3. Store Physical Location &amp; GPS Coordinates
            </div>

            <button
              type="button"
              onClick={handleGetOwnerLocation}
              disabled={isLocatingOwner}
              className="flex items-center gap-1.5 rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocatingOwner ? 'animate-spin' : ''}`} />
              <span>{isLocatingOwner ? 'Locating...' : 'Use Current Location'}</span>
            </button>
          </div>

          {locationStatusMsg && (
            <div className={`rounded-2xl p-3 text-xs font-bold border ${
              locationStatusMsg.includes('captured')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              ℹ️ {locationStatusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Street Address *</label>
              <input
                type="text"
                name="address"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="Door No, Street Name, Area / Locality"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City / Area *</label>
              <input
                type="text"
                name="city"
                required
                value={form.city}
                onChange={handleChange}
                placeholder="Sopore / Srinagar / City Name"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State / PIN Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="w-1/2 rounded-2xl border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="pin"
                  value={form.pin}
                  onChange={handleChange}
                  placeholder="PIN Code"
                  className="w-1/2 rounded-2xl border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">GPS Latitude Coordinate</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: parseFloat(e.target.value) || null }))}
                placeholder="e.g. 34.3868"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-mono font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">GPS Longitude Coordinate</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, longitude: parseFloat(e.target.value) || null }))}
                placeholder="e.g. 74.5221"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-xs font-mono font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Restaurant Media & Brand Assets */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            <ImageIcon className="h-5 w-5 text-orange-600" /> 4. Store Brand Assets &amp; Promotional Video
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
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

        {/* Merchant Statutory & Legal Acknowledgment */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-600 space-y-2">
          <p className="font-bold text-gray-900">Merchant Onboarding Acknowledgment &amp; FSSAI Declaration:</p>
          <p className="text-[11px] leading-relaxed">
            By submitting this application, you declare that your food business holds a valid FSSAI license/registration, agree to adhere to all food safety and hygiene standards, agree to the{' '}
            <Link href="/terms-and-conditions" target="_blank" className="font-bold text-orange-600 hover:underline">
              Zayka Food Terms &amp; Conditions
            </Link>
            , and acknowledge our{' '}
            <Link href="/privacy-policy" target="_blank" className="font-bold text-orange-600 hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3 text-base font-bold text-white shadow-xl shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Submitting Application...' : 'Submit Restaurant Registration Application'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
