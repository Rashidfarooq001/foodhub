'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthEnabled, getApiBaseUrl } from '@foodhub/config';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const API_BASE = getApiBaseUrl();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  
  const [dob, setDob] = useState('');
  const [favoritePerson, setFavoritePerson] = useState('');
  
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Protect against sensitive state persisting on refresh
  useEffect(() => {
    if (step === 3 && !resetToken) {
      setStep(1);
    }
  }, [step, resetToken]);

  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl bg-white p-8 shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">
              Password Reset Temporarily Disabled
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Password reset workflows are temporarily hidden during active development.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-purple-700"
            >
              <span>Return to Command Center</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Admin identifier is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/admin/verify-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Admin account not found for this identifier.');
      }
      setStep(2);
    } catch (err: any) {
      setError('Admin account not found for this identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !favoritePerson) {
      setError('All security answers are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/admin/verify-security-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, dob, favoritePerson }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Security answers could not be verified.');
      }

      setResetToken(data.resetToken);
      setStep(3);
    } catch (err: any) {
      // Use generic error for security
      setError('Security answers could not be verified.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword1.length !== 16 || newPassword2.length !== 8) {
      setError('Password 1 must be 16 digits and Password 2 must be 8 digits.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword1, newPassword2 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      // Clear token after successful use
      setResetToken('');
      alert('Password reset successfully. Please login.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-center text-gray-900 tracking-tight">Admin Recovery</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            {step === 1 && "Identify your admin account"}
            {step === 2 && "Verify your identity"}
            {step === 3 && "Set a new secure password"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleIdentifierSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                Registered Phone / Identifier
              </label>
              <div className="mt-1">
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="+91..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSecurityVerify} className="mt-8 space-y-6">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                Security Question 1: What is your Date of Birth?
              </label>
              <div className="mt-1">
                <input
                  id="dob"
                  type="date"
                  required
                  disabled={loading}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <label htmlFor="favoritePerson" className="block text-sm font-medium text-gray-700">
                Security Question 2: Who is your Favorite Person?
              </label>
              <div className="mt-1">
                <input
                  id="favoritePerson"
                  type="text"
                  required
                  disabled={loading}
                  value={favoritePerson}
                  onChange={(e) => setFavoritePerson(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="Answer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify Answers'}
            </button>
            <button
              type="button"
              onClick={() => {setStep(1); setError('');}}
              className="w-full mt-3 text-sm text-purple-600 hover:text-purple-500"
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="password1" className="block text-sm font-medium text-gray-700">
                New Password 1 (16 digits)
              </label>
              <div className="mt-1">
                <input
                  id="password1"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  required
                  disabled={loading}
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value.replace(/\D/g, ''))}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-100 font-mono tracking-widest"
                  placeholder="16 digits"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">
                New Password 2 (8 digits)
              </label>
              <div className="mt-1">
                <input
                  id="password2"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  disabled={loading}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value.replace(/\D/g, ''))}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-100 font-mono tracking-widest"
                  placeholder="8 digits"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <Link
            href="/login"
            className="text-sm font-medium text-purple-600 hover:text-purple-500"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
