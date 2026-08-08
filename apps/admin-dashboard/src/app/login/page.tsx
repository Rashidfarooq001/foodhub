'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, HelpCircle, KeyRound } from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  const [password1Val, setPassword1Val] = useState('');
  const [password2Val, setPassword2Val] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const p1 = password1Val.trim();
    const p2 = password2Val.trim();

    // Frontend validation: Password 1 (16 digits), Password 2 (8 digits)
    if (!/^\d{16}$/.test(p1)) {
      setError('Password 1 must be exactly 16 numeric digits.');
      return;
    }
    if (!/^\d{8}$/.test(p2)) {
      setError('Password 2 must be exactly 8 numeric digits.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password1: p1, password2: p2 }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError('Invalid admin credentials.');
        return;
      }

      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.profile?.firstName || data.user.name || 'Super Admin',
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      router.push('/');
    } catch {
      setError('Invalid admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-sm">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">FoodHub Admin Portal</h1>
          <p className="text-xs text-gray-500 font-medium">
            Two-Password Authentication System (Restricted to ADMIN / SUPER_ADMIN)
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* TWO-PASSWORD LOGIN FORM */}
        <form onSubmit={handleAdminLogin} className="space-y-6">
          {/* Password 1 Field */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-700 mb-1.5 tracking-wider">
              Password 1 <span className="text-purple-600 font-bold">(16 Numeric Digits)</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                maxLength={16}
                value={password1Val}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPassword1Val(val);
                }}
                placeholder="Enter 16-digit Password 1"
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
              Length: {password1Val.length}/16 digits
            </p>
          </div>

          {/* Password 2 Field */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-700 mb-1.5 tracking-wider">
              Password 2 <span className="text-purple-600 font-bold">(8 Numeric Digits)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                maxLength={8}
                value={password2Val}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPassword2Val(val);
                }}
                placeholder="Enter 8-digit Password 2"
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">
              Length: {password2Val.length}/8 digits
            </p>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/25 hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <span>{isLoading ? 'Verifying Admin Passwords...' : 'Login to Admin Dashboard'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Forgot Password / Account Recovery Notice */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowRecoveryInfo(!showRecoveryInfo)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-purple-600 transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-purple-600" /> Forgot Admin Passwords?
          </button>

          {showRecoveryInfo && (
            <div className="mt-3 rounded-2xl bg-purple-50 p-4 border border-purple-100 text-left text-xs font-medium text-purple-900 space-y-1">
              <span className="font-bold text-purple-700 block text-[11px] uppercase">Secure Admin Recovery Protocol:</span>
              <p className="text-[11px] leading-relaxed text-gray-600">
                For platform security, phone/email password recovery is disabled. Admin credentials recovery must be performed via secure database provisioning script by system administrators.
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-[10px] text-gray-400 font-semibold">
          Protected by FoodHub Two-Password Authentication &amp; RBAC Security
        </div>
      </div>
    </div>
  );
}