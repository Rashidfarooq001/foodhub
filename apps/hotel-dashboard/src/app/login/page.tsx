'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Lock, Mail, ArrowRight } from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function HotelLoginPage() {
  const router = useRouter();
  const { setAuth } = useHotelAuthStore();

  const [email, setEmail] = useState('owner@spicegarden.com');
  const [password, setPassword] = useState('RestaurantPass123!');
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
            id: data.user?.id || 'owner-1',
            email: data.user?.email || email,
            role: data.user?.role || 'RESTAURANT_OWNER',
            name: data.user?.name || 'Restaurant Owner',
            restaurantId: data.user?.restaurantId || 'rest-1',
          },
          data.tokens?.accessToken || data.accessToken || 'owner-token',
          data.tokens?.refreshToken || data.refreshToken || 'owner-refresh-token',
        );
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Login failed. Please check credentials or approval status.');
      }
    } catch {
      setError('Connection error. Please check backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Merchant Partner Portal</h1>
          <p className="text-xs text-gray-500">Sign in to manage kitchen orders, KDS &amp; menus</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Merchant Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
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
                className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Access Kitchen Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
          Protected by FoodHub Restaurant Role Based Access Control
        </div>
      </div>
    </div>
  );
}
