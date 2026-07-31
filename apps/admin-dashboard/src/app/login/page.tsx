'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? getApiBaseUrl()
    : 'https://foodhub-backend-enq2.onrender.com/api/v1';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  const [phone] = useState('+919999999999');
  const [password, setPassword] = useState('SuperAdmin123!');

  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');
    setMessage('');

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

      if (data.requires2FA) {
  setRequires2FA(true);
  setMessage(`${data.message} (OTP: ${data.otp})`);
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

  const handleVerifyOtp = async (
    e: React.FormEvent,
  ) => {
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
          otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message || 'OTP verification failed',
        );
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
  };return (
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
          {!requires2FA
            ? 'Sign in to access platform command center'
            : 'Enter the OTP sent to your registered phone'}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
          {message}
        </div>
      )}

      {!requires2FA ? (
        <form onSubmit={handleLogin} className="space-y-5"><div>
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

</form>) : (

<form
  onSubmit={handleVerifyOtp}
  className="space-y-5"
>

  <div className="flex justify-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
      <KeyRound className="h-7 w-7" />
    </div>
  </div>

  <div className="text-center">
    <h2 className="text-lg font-black text-gray-900">
      Verify OTP
    </h2>

    <p className="mt-2 text-xs text-gray-500">
      Enter the OTP sent to
      <br />
      <span className="font-bold text-gray-700">
        {phone}
      </span>
    </p>
  </div>

  <div>
    <label className="block text-xs font-bold text-gray-700 mb-1">
      One Time Password
    </label>

    <input
      type="text"
      maxLength={6}
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
      placeholder="Enter 6-digit OTP"
      className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-center text-lg font-black tracking-[8px] focus:border-green-600 focus:outline-none"
    />
  </div>

  <button
    type="submit"
    disabled={isLoading}
    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-xs font-black text-white shadow-lg shadow-green-500/25 hover:bg-green-700 disabled:opacity-50"
  >
    <span>
      {isLoading
        ? 'Verifying...'
        : 'Verify OTP'}
    </span>

    <ArrowRight className="h-4 w-4" />
  </button>

  <button
    type="button"
    onClick={() => {
      setRequires2FA(false);
      setOtp('');
      setMessage('');
    }}
    className="w-full rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
  >
    Back
  </button>

</form>

)}      <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
        Protected by FoodHub Enterprise RBAC &amp; JWT Session Management
      </div>

    </div>
  </div>
);
}