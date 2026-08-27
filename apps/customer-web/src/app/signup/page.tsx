'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, ArrowRight, ShieldCheck, Lock, User, MapPin, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // Fresh empty state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [signupStep, setSignupStep] = useState<'FORM' | 'VERIFY_OTP' | 'ACCOUNT_CREATING'>('FORM');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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

  const handleCreateAccountClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setError('You must agree to the Terms & Conditions and acknowledge the Privacy Policy before creating an account.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Pre-check phone availability
      const checkRes = await fetch(`${API_BASE}/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const checkData = await checkRes.json().catch(() => ({}));
      if (!checkRes.ok) {
        throw new Error(checkData.message || 'Phone number is already registered. Please login.');
      }

      // Phone available -> Trigger MSG91 OTP without creating account
      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
      const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '556022TLShucwZ86a6d8a7bP1';
      const identifier = formatIdentifier(phone);

      const configuration = {
        widgetId,
        tokenAuth,
        identifier,
        exposeMethods: true,
        captchaRenderId: '',
        success: (msgData: any) => {
          const token = typeof msgData === 'string' ? msgData : (msgData?.message || msgData?.jwtToken || msgData?.accessToken || msgData?.token);
          if (token) {
            handleCompleteSignupWithWidgetToken(token);
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
            (window as any).sendOtp(identifier, () => {}, (err: any) => console.error('[MSG91 Signup] sendOtp error:', err));
          }
        } catch (widgetErr: any) {
          console.warn('[MSG91 Signup] initSendOTP exception:', widgetErr);
        }
      }

      setSignupStep('VERIFY_OTP');
      setCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Signup initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignupWithWidgetToken = async (accessToken: string) => {
    setError('');
    setSignupStep('ACCOUNT_CREATING');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          targetRole: 'CUSTOMER',
          phone,
          name,
          address,
          password,
          termsAccepted: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Phone verification failed.');
      }

      setSuccessMsg('Phone number verified! Creating your account...');

      setAuth(
        {
          id: data.user.id,
          phone: data.user.phone,
          email: data.user.email,
          role: data.user.role,
          firstName: data.user.profile?.firstName || name,
          lastName: data.user.profile?.lastName || '',
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Account creation failed after OTP verification.');
      setSignupStep('VERIFY_OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOtpManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter the complete 4-digit OTP');
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
        console.warn('[MSG91 Signup] verifyOtp exception:', verifyErr);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: enteredOtp,
          targetRole: 'CUSTOMER',
          name,
          address,
          password,
          termsAccepted: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      setSuccessMsg('Phone number verified! Creating your account...');

      setAuth(
        {
          id: data.user.id,
          phone: data.user.phone,
          email: data.user.email,
          role: data.user.role,
          firstName: data.user.profile?.firstName || name,
          lastName: data.user.profile?.lastName || '',
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Account creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-5">
        <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Authentication Disabled</h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Customer registration screens are temporarily hidden during active development.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800"
            >
              <span>Return Home</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-5">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Create Customer Account</h2>
          <p className="text-xs text-gray-500">
            {signupStep === 'FORM'
              ? 'Fill details and verify mobile number to register'
              : 'Enter SMS OTP sent to your phone to finish signup'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-600 border border-rose-100">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700 border border-emerald-100">
            ✅ {successMsg}
          </div>
        )}

        {signupStep === 'FORM' ? (
          <form onSubmit={handleCreateAccountClick} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter delivery address (optional)"
                  autoComplete="off"
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
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Legal Terms & Privacy Acknowledgment Checkbox */}
            <div className="rounded-2xl bg-orange-50/50 p-3.5 border border-orange-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                />
                <span className="leading-snug text-[11px] sm:text-xs">
                  I agree to the{' '}
                  <Link
                    href="/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-orange-600 hover:underline"
                  >
                    Terms &amp; Conditions
                  </Link>{' '}
                  and acknowledge the{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-orange-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!termsAccepted || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
            >
              <span>{isLoading ? 'Checking Phone...' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2 text-xs">
              <span className="text-gray-500">Already have an account? </span>
              <Link href="/login" className="font-bold text-orange-600 hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        ) : signupStep === 'VERIFY_OTP' ? (
          <form onSubmit={handleVerifySignupOtpManual} className="space-y-5">
            <div className="rounded-2xl bg-orange-50 p-3 text-center border border-orange-100">
              <p className="text-xs font-bold text-orange-900">Verify Mobile Number</p>
              <p className="text-[11px] text-orange-700 mt-0.5">OTP code sent to <span className="font-black">+{phone.replace(/\D/g, '')}</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 text-center">Enter 4-Digit MSG91 OTP</label>
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isLoading ? 'Verifying Phone...' : 'Verify Phone & Create Account'}</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => { setSignupStep('FORM'); setError(''); }}
                className="flex items-center gap-1 font-bold text-gray-500 hover:text-orange-600"
              >
                <X className="h-3.5 w-3.5" /> Cancel / Edit Details
              </button>

              {cooldown > 0 ? (
                <span className="font-bold text-gray-400">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCreateAccountClick({ preventDefault: () => {} } as any)}
                  className="flex items-center gap-1 font-bold text-orange-600 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Resend OTP
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="py-5 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 animate-pulse">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">Phone Number Verified!</h3>
              <p className="text-xs text-emerald-700 font-bold">Creating your customer account...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by ZaykaFood 256-bit SSL Session Management</span>
        </div>
      </div>
    </div>
  );
}
