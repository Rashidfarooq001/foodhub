"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{16}$/.test(password1)) {
      setError('Password 1 must be exactly 16 numeric digits.');
      return;
    }
    if (!/^\d{8}$/.test(password2)) {
      setError('Password 2 must be exactly 8 numeric digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password1, password2 }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Authentication failed.';
        throw new Error(msg);
      }

      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Left panel — brand side */}
      <div className="hidden lg:flex w-[420px] xl:w-[480px] shrink-0 flex-col justify-between bg-white border-r border-gray-100 p-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/zaykafood-logo.png"
            alt="ZaykaFood"
            className="h-8 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            SuperAdmin
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-snug">
            Platform<br />Control Center
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Full-access administrative portal for restaurants, drivers, orders, payments, and platform settings.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Restaurant onboarding & approval',
              'Driver management & payouts',
              'Global orders & analytics',
              'Payments, refunds & settlements',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0" />
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} ZaykaFood. Restricted access.
        </p>
      </div>

      {/* Right panel — form side */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <img
            src="/zaykafood-logo.png"
            alt="ZaykaFood"
            className="h-7 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            SuperAdmin
          </span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your administrator credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {/* Password 1 */}
            <div>
              <label
                htmlFor="password1"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password 1
                <span className="ml-1.5 text-xs font-normal text-gray-400">(16 digits)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="password1"
                  type={show1 ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={16}
                  required
                  autoComplete="off"
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  placeholder="16 numeric digits"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 font-mono tracking-wider
                    transition-colors
                    focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShow1((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={show1 ? 'Hide password' : 'Show password'}
                >
                  {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password 2 */}
            <div>
              <label
                htmlFor="password2"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password 2
                <span className="ml-1.5 text-xs font-normal text-gray-400">(8 digits)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="password2"
                  type={show2 ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  required
                  autoComplete="off"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  placeholder="8 numeric digits"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 font-mono tracking-wider
                    transition-colors
                    focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShow2((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={show2 ? 'Hide password' : 'Show password'}
                >
                  {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white
                transition-colors
                hover:bg-purple-700
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Access is restricted to authorised ZaykaFood platform administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
