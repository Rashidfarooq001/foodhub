'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Phone,
  Lock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function DeliveryForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<'PHONE' | 'OTP' | 'RESET' | 'SUCCESS'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Step 1: Check Role & Request Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered courier mobile number.');
      return;
    }

    setIsLoading(true);
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          targetRole: 'DELIVERY', // Restricts recovery strictly to DELIVERY_PARTNER
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'No authorized courier account found for this phone number.');
        return;
      }

      setStep('OTP');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 4) {
      setError('Please enter the complete OTP code.');
      return;
    }

    setIsLoading(true);
    const cleanDigits = phone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Invalid or expired OTP code.');
        return;
      }

      setResetToken(data.resetToken || 'valid-token');
      setStep('RESET');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const cleanDigits = phone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          otp,
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Failed to reset password.');
        return;
      }

      setStep('SUCCESS');
    } catch {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 items-center justify-center">
            <img
              src="/zaykafood-logo.png"
              alt="ZaykaFood"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Courier Password Recovery</h1>
          <p className="text-xs text-gray-500">
            Reset credentials for verified DELIVERY_PARTNER accounts
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PHONE */}
        {step === 'PHONE' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Registered Courier Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter registered 10-digit phone"
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <span>{isLoading ? 'Sending Reset Code...' : 'Send OTP Code'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-emerald-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Courier Login
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-center space-y-1">
              <p className="text-xs font-bold text-emerald-900">Enter Verification Code</p>
              <p className="text-[11px] text-emerald-700">
                OTP sent to registered phone{' '}
                <span className="font-black">+{phone.replace(/\D/g, '')}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 text-center">
                4-Digit SMS OTP
              </label>
              <input
                type="text"
                maxLength={4}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit code"
                className="w-full rounded-2xl border-2 border-emerald-200 py-3 text-center text-lg font-black text-gray-900 focus:border-emerald-600 focus:outline-none tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify OTP Code'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <span>{isLoading ? 'Resetting Password...' : 'Confirm Reset Password'}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-900">Password Reset Successfully</h2>
              <p className="text-xs text-gray-500">
                Your delivery partner account password has been updated.
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase text-white shadow-lg hover:bg-emerald-700 transition"
            >
              Back to Courier Login
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 py-3 text-center text-xs text-gray-400">
        <div className="mx-auto max-w-md flex items-center justify-center gap-4 text-xs">
          <span>ZaykaFood Delivery</span>
          <span>•</span>
          <Link href="/login" className="hover:text-white transition">
            Login
          </Link>
          <span>•</span>
          <Link href="/support" className="hover:text-white transition">
            Help &amp; Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
