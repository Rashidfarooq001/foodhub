'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Lock, Phone, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl } from '@foodhub/config';
import Link from 'next/link';

const API_BASE = getApiBaseUrl();

export default function HotelLoginPage() {
  const router = useRouter();
  const { setAuth } = useHotelAuthStore();

  // Form states
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanIdentity = identity.trim();
    if (!cleanIdentity) {
      setError('Please enter your registered phone number or email.');
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setIsLoading(false);
      return;
    }

    const payload = cleanIdentity.includes('@')
      ? { email: cleanIdentity, password, targetRole: 'HOTEL' }
      : { phone: cleanIdentity, password, targetRole: 'HOTEL' };

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const profileData = data.user?.profile;
        const fullName = profileData?.firstName
          ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
          : data.user?.name || 'Restaurant Owner';

        setAuth(
          {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: fullName,
            firstName: profileData?.firstName,
            lastName: profileData?.lastName,
            avatarUrl: profileData?.avatarUrl || undefined,
            restaurantId: data.user.restaurantId,
          },
          data.tokens.accessToken,
          data.tokens.refreshToken || data.tokens.accessToken,
        );
        router.push('/');
      } else {
        setError(data.message || 'Login failed. Please check credentials or approval status.');
      }
    } catch {
      setError('Connection error. Please check backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Merchant Partner Portal</h1>
          <p className="text-xs text-gray-500 font-medium">
            Sign in to manage kitchen orders, KDS &amp; menus
          </p>
        </div>

        {/* Session Expired Banner */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('expired') === 'true' && (
          <div className="rounded-2xl bg-amber-50 p-4 text-center text-xs font-bold text-amber-800 border border-amber-200 shadow-sm">
            ⚠️ Your session has expired. Please log in again.
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {/* MERCHANT PASSWORD LOGIN FORM */}
        <form onSubmit={handlePasswordLogin} className="space-y-6">
          {/* Registered Phone Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Registered Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="Enter registered 10-digit mobile (+91...) or email"
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700">Password</label>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Forgot Password?</span>
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50 transition"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
          <span>Protected by FoodHub Restaurant Role Based Access Control</span>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 inset-x-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 py-3 text-center text-xs text-gray-400">
        <div className="mx-auto max-w-md flex items-center justify-center gap-4 text-xs">
          <span>FoodHub Partner</span>
          <span>•</span>
          <Link href="/support" className="hover:text-white transition">Help &amp; Contact</Link>
          <span>•</span>
          <Link href="/partner/register" className="font-bold text-orange-500 hover:text-orange-400 transition underline">
            Become a Partner
          </Link>
        </div>
      </footer>
    </div>
  );
}
