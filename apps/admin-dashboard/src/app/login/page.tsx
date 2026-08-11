'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, HelpCircle, KeyRound, CheckCircle2, Calendar, UserCheck } from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

type ViewMode = 'LOGIN' | 'RECOVERY_QUESTIONS' | 'RECOVERY_RESET' | 'RECOVERY_SUCCESS';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  const [mode, setMode] = useState<ViewMode>('LOGIN');

  // Login Form State
  const [password1Val, setPassword1Val] = useState('');
  const [password2Val, setPassword2Val] = useState('');

  // Security Questions Form State
  const [dob, setDob] = useState('');
  const [favoritePerson, setFavoritePerson] = useState('');

  // Password Reset Form State
  const [resetToken, setResetToken] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [confirmPassword1, setConfirmPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [confirmPassword2, setConfirmPassword2] = useState('');

  // Feedback State
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpiredSession, setIsExpiredSession] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setIsExpiredSession(true);
      }
    }
  }, []);

  // 1. Handle Admin Two-Password Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const p1 = password1Val.trim();
    const p2 = password2Val.trim();

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

      const profileData = data.user?.profile;
      const fullName = profileData?.firstName
        ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
        : data.user?.name || 'Super Admin';

      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          name: fullName,
          firstName: profileData?.firstName,
          lastName: profileData?.lastName,
          avatarUrl: profileData?.avatarUrl || undefined,
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

  // 2. Handle Security Questions Verification
  const handleVerifyQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dob) {
      setError('Please select your Date of Birth (*)');
      return;
    }
    if (!favoritePerson.trim()) {
      setError('Please enter Favorite Person (*)');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/verify-security-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dob: dob.trim(),
          favoritePerson: favoritePerson.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Unable to verify the recovery information.');
        return;
      }

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setMode('RECOVERY_RESET');
        setError('');
      } else {
        setError('Unable to verify the recovery information.');
      }
    } catch {
      setError('Unable to verify the recovery information.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const p1 = newPassword1.trim();
    const p2 = newPassword2.trim();

    if (!/^\d{16}$/.test(p1)) {
      setError('New Password 1 must be exactly 16 numeric digits.');
      return;
    }
    if (p1 !== confirmPassword1.trim()) {
      setError('New Password 1 and Confirm Password 1 do not match.');
      return;
    }
    if (!/^\d{8}$/.test(p2)) {
      setError('New Password 2 must be exactly 8 numeric digits.');
      return;
    }
    if (p2 !== confirmPassword2.trim()) {
      setError('New Password 2 and Confirm Password 2 do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword1: p1,
          newPassword2: p2,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Failed to reset Admin password. Token may be expired.');
        return;
      }

      setMode('RECOVERY_SUCCESS');
      setError('');
    } catch {
      setError('Network error resetting password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllForms = () => {
    setMode('LOGIN');
    setPassword1Val('');
    setPassword2Val('');
    setDob('');
    setFavoritePerson('');
    setResetToken('');
    setNewPassword1('');
    setConfirmPassword1('');
    setNewPassword2('');
    setConfirmPassword2('');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
        {/* VIEW 1: NORMAL LOGIN */}
        {mode === 'LOGIN' && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-sm">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">FoodHub Admin Portal</h1>
              <p className="text-xs text-gray-500 font-medium">
                Two-Password Authentication System (Restricted to ADMIN / SUPER_ADMIN)
              </p>
            </div>

            {isExpiredSession && (
              <div className="rounded-2xl bg-amber-50 p-4 text-center text-xs font-bold text-amber-800 border border-amber-200 shadow-sm">
                ⚠️ Your session has expired. Please log in again.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-6">
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

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setMode('RECOVERY_QUESTIONS');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Forgot Password?</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/25 hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Verifying Admin Passwords...' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="text-center text-[10px] text-gray-400 font-semibold pt-2 border-t border-gray-100">
              Protected by FoodHub Two-Password Authentication &amp; RBAC Security
            </div>
          </>
        )}

        {/* VIEW 2: SECURITY QUESTIONS RECOVERY */}
        {mode === 'RECOVERY_QUESTIONS' && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                <UserCheck className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Reset Admin Password</h1>
              <p className="text-xs text-gray-500 font-medium">
                Verify your security information to reset your password.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyQuestions} className="space-y-6">
              {/* Question 1: Date of Birth */}
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1.5 tracking-wider">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Question 2: Favorite Person */}
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1.5 tracking-wider">
                  Favorite Person <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={favoritePerson}
                    onChange={(e) => setFavoritePerson(e.target.value)}
                    placeholder="Enter favorite person"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetAllForms}
                  className="w-1/3 rounded-2xl border border-gray-200 py-3.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-600/25 hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        )}

        {/* VIEW 3: CREATE NEW PASSWORD */}
        {mode === 'RECOVERY_RESET' && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-sm">
                <KeyRound className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Create New Admin Password</h1>
              <p className="text-xs text-gray-500 font-medium">
                Set your new 16-digit Password 1 and 8-digit Password 2.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1 tracking-wider">
                  New Password 1 (16 Digits)
                </label>
                <input
                  type="password"
                  required
                  maxLength={16}
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 16 numeric digits"
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1 tracking-wider">
                  Confirm Password 1
                </label>
                <input
                  type="password"
                  required
                  maxLength={16}
                  value={confirmPassword1}
                  onChange={(e) => setConfirmPassword1(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter 16 numeric digits"
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1 tracking-wider">
                  New Password 2 (8 Digits)
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 8 numeric digits"
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1 tracking-wider">
                  Confirm Password 2
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  value={confirmPassword2}
                  onChange={(e) => setConfirmPassword2(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter 8 numeric digits"
                  className="w-full rounded-2xl border border-gray-200 py-3 px-4 text-xs font-mono font-bold tracking-widest text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/25 hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <span>{isLoading ? 'Updating Password...' : 'Reset Password'}</span>
              </button>
            </form>
          </>
        )}

        {/* VIEW 4: SUCCESS */}
        {mode === 'RECOVERY_SUCCESS' && (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900">Password Reset Successfully</h1>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Your Admin credentials have been updated and all previous active sessions have been revoked.
              </p>
            </div>

            <button
              onClick={resetAllForms}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-gray-800 transition"
            >
              <span>Back to Admin Login</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}