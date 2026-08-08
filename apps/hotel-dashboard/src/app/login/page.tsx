'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Lock, Mail, ArrowRight, Phone, CheckCircle2, RotateCcw, Edit2, ShieldCheck } from 'lucide-react';
import { useHotelAuthStore } from '../../stores/use-hotel-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';
import Link from 'next/link';

const API_BASE = getApiBaseUrl();

export default function HotelLoginPage() {
  const router = useRouter();
  const { setAuth } = useHotelAuthStore();

  const [loginMode, setLoginMode] = useState<'PASSWORD' | 'OTP'>('OTP');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Form states
  const [identity, setIdentity] = useState('owner@spicegarden.com');
  const [password, setPassword] = useState('RestaurantPass123!');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState(['', '', '', '']);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Load MSG91 script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('msg91-verify-script')) return;

    const script = document.createElement('script');
    script.id = 'msg91-verify-script';
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const formatIdentifier = (raw: string): string => {
    const cleaned = raw.replace(/\D/g, '');
    return cleaned.length === 10 ? `91${cleaned}` : cleaned;
  };

  const handleWidgetSuccess = async (accessToken: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, targetRole: 'HOTEL' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Hotel partner authentication failed');
      }

      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.profile?.firstName || data.user.name || 'Merchant Owner',
          restaurantId: data.user.restaurantId,
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed for merchant portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered merchant mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '556022TLShucwZ86a6d8a7bP1';
    const identifier = formatIdentifier(phone);

    const configuration = {
      widgetId,
      tokenAuth,
      identifier,
      exposeMethods: true,
      captchaRenderId: '',
      success: (data: any) => {
        const token = typeof data === 'string' ? data : (data?.message || data?.jwtToken || data?.accessToken || data?.token);
        if (token) {
          handleWidgetSuccess(token);
        } else {
          setError('Verification succeeded on MSG91, but token was missing.');
          setIsLoading(false);
        }
      },
      failure: (err: any) => {
        setError(typeof err === 'string' ? err : (err?.message || 'OTP verification failed'));
        setIsLoading(false);
      },
    };

    if (typeof window !== 'undefined' && typeof (window as any).initSendOTP === 'function') {
      try {
        (window as any).initSendOTP(configuration);
        if (typeof (window as any).sendOtp === 'function') {
          (window as any).sendOtp(identifier, () => {}, (err: any) => console.error('[MSG91 Hotel] sendOtp error:', err));
        }
        setStep('OTP');
        setCooldown(30);
        setIsLoading(false);
        return;
      } catch (widgetErr: any) {
        console.warn('[MSG91 Hotel] initSendOTP exception:', widgetErr?.message || widgetErr);
      }
    }

    setStep('OTP');
    setCooldown(30);
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter the complete OTP code');
      return;
    }
    setError('');
    setIsLoading(true);

    if (typeof window !== 'undefined' && typeof (window as any).verifyOtp === 'function') {
      try {
        (window as any).verifyOtp(enteredOtp, () => {}, (err: any) => {
          setError(typeof err === 'string' ? err : (err?.message || 'OTP verification failed'));
          setIsLoading(false);
        });
        return;
      } catch (verifyErr: any) {
        console.warn('[MSG91 Hotel] verifyOtp exception:', verifyErr);
      }
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload = identity.includes('@')
      ? { email: identity.trim(), password }
      : { phone: identity.trim(), password };

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const profileData = data.user?.profile;
        const fullName = profileData?.firstName
          ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
          : data.user?.name || 'Restaurant Owner';
        setAuth(
          {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: fullName,
            firstName: profileData?.firstName,
            lastName: profileData?.lastName,
            avatarUrl: profileData?.avatarUrl || undefined,
            restaurantId: data.user.restaurantId,
          },
          data.tokens.accessToken,
          data.tokens.refreshToken,
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
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Merchant Partner Portal</h1>
          <p className="text-xs text-gray-500">Sign in to manage kitchen orders, KDS &amp; menus</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 rounded-2xl bg-gray-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setLoginMode('OTP'); setError(''); }}
            className={`rounded-xl py-2.5 transition ${loginMode === 'OTP' ? 'bg-white text-orange-600 shadow' : 'text-gray-500 hover:text-gray-900'}`}
          >
            MSG91 OTP Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('PASSWORD'); setError(''); }}
            className={`rounded-xl py-2.5 transition ${loginMode === 'PASSWORD' ? 'bg-white text-orange-600 shadow' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Password Login
          </button>
        </div>

        {/* Session Expired Banner */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('expired') === 'true' && (
          <div className="rounded-2xl bg-amber-50 p-4 text-center text-xs font-bold text-amber-800 border border-amber-200 shadow-sm">
            ⚠️ Your session has expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            ⚠️ {error}
          </div>
        )}

        {loginMode === 'OTP' ? (
          step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Registered Merchant Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter registered 10-digit mobile"
                    className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending OTP...' : 'Continue with MSG91 OTP'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex justify-center gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      if (!/^\d*$/.test(e.target.value)) return;
                      const next = [...otp];
                      next[idx] = e.target.value.substring(e.target.value.length - 1);
                      setOtp(next);
                      if (e.target.value && idx < 3) otpInputsRef.current[idx + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                        otpInputsRef.current[idx - 1]?.focus();
                      }
                    }}
                    className="h-12 w-12 rounded-2xl border-2 border-gray-200 text-center text-lg font-black text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isLoading ? 'Verifying...' : 'Verify & Access Dashboard'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('PHONE'); setError(''); }}
                  className="flex items-center gap-1 font-bold text-gray-500 hover:text-orange-600"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Phone
                </button>
                {cooldown > 0 ? (
                  <span className="font-bold text-gray-400">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="flex items-center gap-1 font-bold text-orange-600 hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Resend OTP
                  </button>
                )}
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Merchant Phone or Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Enter registered phone (+91...) or email"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => { setLoginMode('OTP'); setError(''); }}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  Forgot Password? (Use OTP)
                </button>
              </div>
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
        )}

        <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
          <span>Protected by FoodHub Restaurant Role Based Access Control</span>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 inset-x-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 py-3 text-center text-xs text-gray-400">
        <div className="mx-auto max-w-md flex items-center justify-center gap-4 text-xs">
          <span>FoodHub Partner</span>
          <span>•</span>
          <Link href="/support" className="hover:text-white transition">Help &amp; Contact</Link>
          <span>•</span>
          <Link href="/partner/register" className="font-bold text-orange-500 hover:text-orange-400 transition underline">
            Become a Partner
          </Link>
        </div>
      </footer>
    </div>
  );
}
