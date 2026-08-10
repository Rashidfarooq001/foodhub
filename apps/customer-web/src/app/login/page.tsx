'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // Login form state (starts completely empty)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Password Login for existing customers
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, targetRole: 'CUSTOMER' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Frontend safety net: reject non-CUSTOMER accounts even if backend somehow passed them
      if (data.user?.role && data.user.role !== 'CUSTOMER') {
        throw new Error(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
      }

      setAuth(
        {
          id: data.user.id,
          phone: data.user.phone,
          email: data.user.email,
          role: data.user.role,
          firstName: data.user.profile?.firstName || 'Customer',
          lastName: data.user.profile?.lastName || '',
          avatarUrl: data.user.profile?.avatarUrl || undefined,
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Authentication Disabled</h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Customer authentication screens are temporarily hidden during active development (`AUTH_ENABLED=false`).
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800"
            >
              <span>Return Home</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Customer Login</h2>
          <p className="text-xs text-gray-500">
            Enter your mobile number and password to access your account
          </p>
        </div>



        {/* Session Expired Banner */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('expired') === 'true' && (
          <div className="rounded-2xl bg-amber-50 p-4 text-center text-xs font-bold text-amber-800 border border-amber-200 shadow-sm">
            ⚠️ Your session has expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-600 border border-rose-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handlePasswordLogin} className="space-y-5" autoComplete="on">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                autoComplete="tel"
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to FoodHub'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center pt-2 text-xs">
            <span className="text-gray-500">Don't have an account? </span>
            <Link href="/signup" className="font-bold text-orange-600 hover:underline">
              Sign Up
            </Link>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by FoodHub 256-bit SSL Session Management</span>
        </div>
      </div>
    </div>
  );
}
