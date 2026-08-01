'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';

import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';
import Link from 'next/link';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? getApiBaseUrl()
    : 'https://foodhub-backend-enq2.onrender.com/api/v1';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Admin Login Temporarily Disabled</h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Administrator login authentication screens are temporarily hidden during active development.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-purple-700"
            >
              <span>Access Command Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [phone] = useState('+919999999999');
  const [password, setPassword] = useState('SuperAdmin123!');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name:
            data.user.profile?.firstName ||
            'Super Admin',
        },
        data.tokens.accessToken,
        data.tokens.refreshToken,
      );

      router.push('/');
    } catch (err) {
      console.error(err);
      setError('Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl">

        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-black text-gray-900">
            FoodHub Admin Portal
          </h1>

          <p className="text-xs text-gray-500">
            Sign in to access platform command center
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Admin Phone
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={phone}
                readOnly
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-xs font-black text-white shadow-lg shadow-purple-500/25 hover:bg-purple-700 disabled:opacity-50"
          >
            <span>
              {isLoading ? 'Signing In...' : 'Continue'}
            </span>

            <ArrowRight className="h-4 w-4" />
          </button>
        </form>


<div className="text-center mt-4">
  <button
    type="button"
    onClick={() => router.push('/forgot-password')}
    className="text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline"
  >
    Forgot Password?
  </button>
</div>

<div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
          Protected by FoodHub Enterprise RBAC &amp; JWT Session Management
        </div>

      </div>
    </div>
  );
}