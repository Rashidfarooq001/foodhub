'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bike, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Phone, Mail, Lock, User, FileText, Truck, MapPin } from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';

const API_BASE = getApiBaseUrl();

export default function DeliveryPartnerRegisterPage() {
  const router = useRouter();
  const { setAuth } = useDeliveryAuthStore();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ code: string; name: string }>>([]);

  // Load vehicle types from backend — database schema is the source of truth
  useEffect(() => {
    fetch(`${API_BASE}/drivers/vehicle-types`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setVehicleTypes(data); })
      .catch(() => {
        setVehicleTypes([
          { code: 'MOTORCYCLE', name: 'Motorcycle / Bike' },
          { code: 'SCOOTER', name: 'Scooter' },
          { code: 'EV_SCOOTER', name: 'Electric Scooter (EV)' },
          { code: 'BICYCLE', name: 'Bicycle' },
        ]);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanDigits = form.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!form.email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (!form.vehicleNumber.trim()) {
      setErrorMsg('Vehicle Registration Number is required');
      return;
    }
    if (!form.licenseNumber.trim()) {
      setErrorMsg('Driving License Number is required');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        phone: `+91${cleanDigits}`,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        licenseNumber: form.licenseNumber.trim().toUpperCase(),
        addressLine: form.addressLine.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/auth/register/delivery-partner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.user && data.tokens?.accessToken) {
          setAuth(
            {
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone || form.phone,
              role: data.user.role,
              name: data.user.name || form.name,
              driverId: data.user.driverId || data.user.driver?.id,
              isApproved: data.user.driver?.isApproved ?? false,
            },
            data.tokens.accessToken,
            data.tokens.refreshToken || data.tokens.accessToken,
          );
        }
        setSubmitted(true);
      } else {
        throw new Error(data.message || 'Registration failed. Please check details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error while submitting application.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900">Application Submitted!</h1>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your FoodHub Delivery Partner application has been received and is under review by FoodHub Operations.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 space-y-1">
            <p className="uppercase tracking-wider text-[10px] text-amber-700 font-black">Application Status</p>
            <p className="text-sm font-black text-amber-800">UNDER ADMIN REVIEW (isApproved=false)</p>
          </div>

          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700"
            >
              <span>Go to Rider Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Bike className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black">Become a FoodHub Delivery Partner</h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Earn flexible income delivering food orders across your city
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700 shadow-md">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 text-base font-black text-gray-900 border-b border-gray-100 pb-4">
            <User className="h-5 w-5 text-orange-600" /> Personal &amp; Account Details
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Aadil Ahmad"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Mobile Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543211"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="aadil@example.com"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-base font-black text-gray-900 border-b border-gray-100 pt-4 pb-3">
            <Truck className="h-5 w-5 text-orange-600" /> Vehicle &amp; License Info
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Vehicle Type *</label>
              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="" disabled>Select vehicle type *</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt.code} value={vt.code}>{vt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Vehicle Registration Number *</label>
              <input
                type="text"
                name="vehicleNumber"
                required
                value={form.vehicleNumber}
                onChange={handleChange}
                placeholder="JK-15-A-1234"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Driving License Number *</label>
              <input
                type="text"
                name="licenseNumber"
                required
                value={form.licenseNumber}
                onChange={handleChange}
                placeholder="JK1520240012345"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50 transition"
          >
            <span>{isLoading ? 'Submitting Application...' : 'Submit Courier Application'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
