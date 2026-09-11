"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Phone } from 'lucide-react';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

type ViewMode = 'LOGIN' | 'OTP';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  const [mode, setMode] = useState<ViewMode>('LOGIN');

  // Two-password credentials
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [otp, setOtp] = useState('');
  
  // MFA State
  const [preAuthToken, setPreAuthToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startResendTimer = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{16}$/.test(password1)) {
      setError('Password 1 must be exactly 16 numeric digits');
      return;
    }
    if (!/^\d{8}$/.test(password2)) {
      setError('Password 2 must be exactly 8 numeric digits');
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
        const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Invalid credentials');
        throw new Error(msg);
      }
      
      setPreAuthToken(data.preAuthToken);
      setMaskedPhone(data.maskedPhone || 'your registered number');
      setMode('OTP');
      startResendTimer();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/auth/admin/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${preAuthToken}` },
        body: JSON.stringify({ preAuthToken, otp }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }
      
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/login/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      startResendTimer();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          System Administration
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl shadow-black sm:rounded-xl sm:px-10 border border-slate-800">
          
          {error && (
            <div className="mb-6 rounded-md bg-red-900/30 p-4 border border-red-500/50">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {mode === 'LOGIN' && (
            <form className="space-y-6" onSubmit={handlePasswordLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Password 1 <span className="text-slate-500 text-xs">(16 digits)</span>
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={16}
                    required
                    value={password1}
                    onChange={(e) => setPassword1(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg py-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="16 numeric digits"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Password 2 <span className="text-slate-500 text-xs">(8 digits)</span>
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-lg py-3 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="8 numeric digits"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Continue to Verification'}
              </button>
            </form>
          )}

          {mode === 'OTP' && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Two-Step Verification</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Enter the verification code sent to <br />
                  <span className="font-semibold text-white">{maskedPhone}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 text-center">4-Digit Code</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="mt-2 block w-full text-center tracking-[1em] font-mono text-2xl bg-slate-950 border border-slate-800 rounded-lg py-4 text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 4}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
                {!loading && <ArrowRight className="ml-2 -mr-1 h-5 w-5" />}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

