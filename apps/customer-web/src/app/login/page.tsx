'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, ArrowRight, ShieldCheck, Lock, User, MapPin, CheckCircle2, RotateCcw, Edit2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');

  // Login form state (starts completely empty)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state (starts completely empty)
  const [signupName, setSignupName] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Signup OTP state
  const [signupStep, setSignupStep] = useState<'FORM' | 'VERIFY_OTP' | 'ACCOUNT_CREATING'>('FORM');
  const [otp, setOtp] = useState(['', '', '', '']);

  // Forgot Password state (starts completely empty)
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'SEND_OTP' | 'VERIFY_RESET'>('SEND_OTP');

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

  // Reset signup form to fresh empty state
  const resetSignupForm = () => {
    setSignupName('');
    setSignupAddress('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupStep('FORM');
    setError('');
    setSuccessMsg('');
  };

  // Switch to Signup mode
  const switchToSignup = () => {
    setMode('SIGNUP');
    resetSignupForm();
  };

  // Switch to Login mode
  const switchToLogin = () => {
    setMode('LOGIN');
    setError('');
    setSuccessMsg('');
  };

  // Switch to Forgot Password mode
  const switchToForgotPassword = () => {
    setMode('FORGOT_PASSWORD');
    setForgotPhone(loginPhone || '');
    setForgotStep('SEND_OTP');
    setError('');
    setSuccessMsg('');
  };

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

  // 1. Password Login for existing customers
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      setAuth(
        {
          id: data.user.id,
          phone: data.user.phone,
          email: data.user.email,
          role: data.user.role,
          firstName: data.user.profile?.firstName || 'Customer',
          lastName: data.user.profile?.lastName || '',
        },
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Signup Step 1: Pre-check phone availability -> Trigger MSG91 OTP (do NOT create account yet)
  const handleCreateAccountClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setError('Please enter your full name');
      return;
    }
    const cleanDigits = signupPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Step 4: Check if phone is already registered
      const checkRes = await fetch(`${API_BASE}/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: signupPhone }),
      });

      const checkData = await checkRes.json().catch(() => ({}));
      if (!checkRes.ok) {
        // Step 5: Reject signup, do NOT send OTP
        throw new Error(checkData.message || 'Phone number is already registered. Please login.');
      }

      // Step 6: Phone available -> Trigger MSG91 OTP without creating account
      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
      const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '556022TLShucwZ86a6d8a7bP1';
      const identifier = formatIdentifier(signupPhone);

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

  // 3. Signup Step 2: Verify MSG91 token & create CUSTOMER account ONLY after verified OTP
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
          phone: signupPhone,
          name: signupName,
          address: signupAddress,
          password: signupPassword,
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
          firstName: data.user.profile?.firstName || signupName,
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

  // 4. Fallback Manual OTP verification for signup
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
          phone: signupPhone,
          otp: enteredOtp,
          targetRole: 'CUSTOMER',
          name: signupName,
          address: signupAddress,
          password: signupPassword,
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
          firstName: data.user.profile?.firstName || signupName,
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

  // 5. Forgot Password OTP Request
  const handleSendResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = forgotPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to request reset OTP.');
      }

      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
      const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '556022TLShucwZ86a6d8a7bP1';
      const identifier = formatIdentifier(forgotPhone);

      const configuration = {
        widgetId,
        tokenAuth,
        identifier,
        exposeMethods: true,
        captchaRenderId: '',
        success: (msgData: any) => {
          console.log('[MSG91 Reset] OTP verified on MSG91 widget.');
        },
        failure: (err: any) => {
          setError(typeof err === 'string' ? err : (err?.message || 'OTP dispatch failed'));
        },
      };

      if (typeof window !== 'undefined' && typeof (window as any).initSendOTP === 'function') {
        (window as any).initSendOTP(configuration);
        if (typeof (window as any).sendOtp === 'function') {
          (window as any).sendOtp(identifier, () => {}, (err: any) => console.error(err));
        }
      }

      setForgotStep('VERIFY_RESET');
      setCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Error requesting reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter the 4-digit OTP code');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, otp: enteredOtp, newPassword: forgotNewPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Password reset failed.');
      }

      setSuccessMsg('Password reset successfully! Please login with your new password.');
      setMode('LOGIN');
      setLoginPhone(forgotPhone);
      setLoginPassword(forgotNewPassword);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthEnabled()) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Authentication Disabled</h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Customer authentication screens are temporarily hidden during active development (`AUTH_ENABLED=false`).
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800"
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
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {mode === 'LOGIN' ? 'Welcome to FoodHub' : mode === 'SIGNUP' ? 'Create Customer Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === 'LOGIN'
              ? 'Enter your mobile number and password to sign in'
              : mode === 'SIGNUP'
              ? signupStep === 'FORM'
                ? 'Fill details and verify mobile number to register'
                : 'Enter SMS OTP sent to your phone to finish signup'
              : 'Reset your password via SMS OTP verification'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        {mode !== 'FORGOT_PASSWORD' && (
          <div className="grid grid-cols-2 rounded-2xl bg-gray-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={switchToLogin}
              className={`rounded-xl py-2.5 transition ${mode === 'LOGIN' ? 'bg-white text-orange-600 shadow' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Customer Login
            </button>
            <button
              type="button"
              onClick={switchToSignup}
              className={`rounded-xl py-2.5 transition ${mode === 'SIGNUP' ? 'bg-white text-orange-600 shadow' : 'text-gray-500 hover:text-gray-900'}`}
            >
              New Customer Sign Up
            </button>
          </div>
        )}

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

        {/* 1. Customer Password Login */}
        {mode === 'LOGIN' && (
          <form onSubmit={handlePasswordLogin} className="space-y-5" autoComplete="on">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  autoComplete="tel"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={switchToForgotPassword}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to FoodHub'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* 2. Customer Signup (Completely fresh empty form; phone verification BEFORE account creation) */}
        {mode === 'SIGNUP' && (
          signupStep === 'FORM' ? (
            <form onSubmit={handleCreateAccountClick} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
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
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
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
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
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
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
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
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
              >
                <span>{isLoading ? 'Checking Phone...' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : signupStep === 'VERIFY_OTP' ? (
            <form onSubmit={handleVerifySignupOtpManual} className="space-y-5">
              <div className="rounded-2xl bg-orange-50 p-3 text-center border border-orange-100">
                <p className="text-xs font-bold text-orange-900">Verify Mobile Number</p>
                <p className="text-[11px] text-orange-700 mt-0.5">OTP code sent to <span className="font-black">+{signupPhone.replace(/\D/g, '')}</span></p>
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
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 animate-pulse">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900">Phone Number Verified!</h3>
                <p className="text-xs text-emerald-700 font-bold">Creating your customer account...</p>
              </div>
            </div>
          )
        )}

        {/* 3. Customer Forgot Password */}
        {mode === 'FORGOT_PASSWORD' && (
          forgotStep === 'SEND_OTP' ? (
            <form onSubmit={handleSendResetOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Registered Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="Enter registered mobile number"
                    autoComplete="tel"
                    className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
              >
                <span>{isLoading ? 'Sending Reset OTP...' : 'Send Password Reset OTP'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-xs font-bold text-gray-500 hover:text-orange-600"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Enter 4-Digit OTP Code</label>
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isLoading ? 'Resetting...' : 'Set New Password & Login'}</span>
              </button>
            </form>
          )
        )}

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by FoodHub 256-bit SSL Session Management</span>
        </div>
      </div>
    </div>
  );
}
