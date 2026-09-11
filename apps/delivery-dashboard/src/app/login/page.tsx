'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  RotateCcw,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';
import Link from 'next/link';

const API_BASE = getApiBaseUrl();

export default function DeliveryLoginPage() {
  const router = useRouter();
  const { setAuth } = useDeliveryAuthStore();

  const [loginMode, setLoginMode] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isExpiredSession, setIsExpiredSession] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setIsExpiredSession(true);
      }
    }
  }, []);

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
        body: JSON.stringify({ accessToken, targetRole: 'DELIVERY' }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Courier partner authentication failed');
      }

      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          name: data.user.profile?.firstName || data.user.name || 'Courier Partner',
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed for courier portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered courier mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
    const tokenAuth =
      process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN ||
      process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH ||
      '556022TLShucwZ86a6d8a7bP1';
    const identifier = formatIdentifier(phone);

    const configuration = {
      widgetId,
      tokenAuth,
      identifier,
      exposeMethods: true,
      captchaRenderId: '',
      success: (data: any) => {
        const token =
          typeof data === 'string'
            ? data
            : data?.message || data?.jwtToken || data?.accessToken || data?.token;
        if (token) {
          handleWidgetSuccess(token);
        } else {
          setError('Verification succeeded on MSG91, but token was missing.');
          setIsLoading(false);
        }
      },
      failure: (err: any) => {
        setError(typeof err === 'string' ? err : err?.message || 'OTP verification failed');
        setIsLoading(false);
      },
    };

    if (typeof window !== 'undefined' && typeof (window as any).initSendOTP === 'function') {
      try {
        (window as any).initSendOTP(configuration);
        if (typeof (window as any).sendOtp === 'function') {
          (window as any).sendOtp(
            identifier,
            () => {},
            (err: any) => console.error('[MSG91 Delivery] sendOtp error:', err),
          );
        }
        setStep('OTP');
        setCooldown(30);
        setIsLoading(false);
        return;
      } catch (widgetErr: any) {
        console.warn('[MSG91 Delivery] initSendOTP exception:', widgetErr?.message || widgetErr);
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
        (window as any).verifyOtp(
          enteredOtp,
          () => {},
          (err: any) => {
            setError(typeof err === 'string' ? err : err?.message || 'OTP verification failed');
            setIsLoading(false);
          },
        );
        return;
      } catch (verifyErr: any) {
        console.warn('[MSG91 Delivery] verifyOtp exception:', verifyErr);
      }
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
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
        const profileData = data.user?.profile;
        const fullName = profileData?.firstName
          ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
          : data.user?.name || 'Courier Partner';
        setAuth(
          {
            id: data.user?.id || 'driver-1',
            email: data.user?.email || email,
            phone: data.user?.phone || '',
            role: data.user?.role || 'DELIVERY_PARTNER',
            name: fullName,
            firstName: profileData?.firstName,
            lastName: profileData?.lastName,
            avatarUrl: profileData?.avatarUrl || undefined,
          },
          data.tokens?.accessToken || 'driver-token',
          data.tokens?.refreshToken || 'driver-refresh-token',
        );
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Login failed. Please check credentials.');
      }
    } catch {
      setError('Connection error. Please check backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Left panel — brand side */}
      <div className="hidden lg:flex w-[400px] xl:w-[440px] shrink-0 flex-col justify-between bg-white border-r border-gray-100 p-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/zaykafood-logo.png"
            alt="ZaykaFood"
            className="h-8 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Delivery Partner
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-snug">
            Courier<br />Partner Portal
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Manage your deliveries, track earnings, navigate to drop-offs and update your duty status.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Live order dispatches & navigation',
              'Real-time earnings & ledger',
              'On-duty / off-duty toggle',
              'Payout history & settlements',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} ZaykaFood. Delivery partners only.
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
            Delivery Partner
          </span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Access your courier dashboard to manage deliveries.
            </p>
          </div>

          {/* Session expired notice */}
          {isExpiredSession && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 leading-snug">Your session has expired. Please sign in again.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
            </div>
          )}

          {/* Mode tabs */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 mb-6 text-sm">
            {(['OTP', 'PASSWORD'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setLoginMode(mode); setError(''); setStep('PHONE'); }}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                  loginMode === mode
                    ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'OTP' ? 'Phone OTP' : 'Password'}
              </button>
            ))}
          </div>

          {/* OTP Flow */}
          {loginMode === 'OTP' ? (
            step === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Registered mobile number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      disabled={isLoading}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400
                        focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white
                    hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                    disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP…</>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Enter the 4-digit code sent to{' '}
                    <span className="font-semibold text-gray-900">{phone}</span>
                  </label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputsRef.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
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
                        className="h-12 w-12 rounded-lg border-2 border-gray-200 text-center text-xl font-bold text-gray-900
                          focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length < 4}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white
                    hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                    disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Verify & Sign in</>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('PHONE'); setError(''); }}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit number
                  </button>
                  {cooldown > 0 ? (
                    <span className="text-gray-400">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )
          ) : (
            /* Password flow */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email or phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400
                      focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900
                      focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
                      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white
                  hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                  disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            Access is restricted to registered ZaykaFood delivery partners only.
          </p>
        </div>
      </div>
    </div>
  );
}
