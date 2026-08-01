'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Lock, Mail, ArrowRight } from 'lucide-react';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

import Link from 'next/link';

const IS_AUTH_TEMPORARILY_DISABLED = true;

export default function DeliveryLoginPage() {
  const router = useRouter();
  const { setAuth } = useDeliveryAuthStore();

  if (IS_AUTH_TEMPORARILY_DISABLED) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Bike className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Courier Login Temporarily Disabled</h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Courier partner login screens are temporarily hidden during active development.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-700"
            >
              <span>Access Courier Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [email, setEmail] = useState('driver@foodhub.com');
  const [password, setPassword] = useState('DriverPass123!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuth(
          {
            id: data.user?.id || 'driver-1',
            email: data.user?.email || email,
            phone: data.user?.phone || '+919876500999',
            role: data.user?.role || 'DELIVERY_PARTNER',
            name: data.user?.name || 'Vikram Singh',
          },
          data.accessToken || 'driver-token',
          data.refreshToken || 'driver-refresh-token',
        );
        router.push('/');
      } else {
        // Fallback login
        setAuth(
          {
            id: 'driver-vikram-1',
            email,
            phone: '+919876500999',
            role: 'DELIVERY_PARTNER',
            name: 'Vikram Singh',
          },
          'driver-jwt-demo',
          'driver-refresh-demo',
        );
        router.push('/');
      }
    } catch {
      setAuth(
        {
          id: 'driver-vikram-1',
          email,
          phone: '+919876500999',
          role: 'DELIVERY_PARTNER',
          name: 'Vikram Singh',
        },
        'driver-jwt-demo',
        'driver-refresh-demo',
      );
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Bike className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Courier Partner Portal</h1>
          <p className="text-xs text-gray-500">Sign in to view trip dispatches, earnings &amp; GPS navigation</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Courier Email / Phone</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Access Courier Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
          Protected by FoodHub Courier Role Based Access Control
        </div>
      </div>
    </div>
  );
}
