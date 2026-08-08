'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, Edit2, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('7006298795');
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

  // Dynamically load Official MSG91 Custom UI Script (https://verify.msg91.com/otp-provider.js)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('msg91-verify-script')) return;

    console.log('[Frontend MSG91] Loading https://verify.msg91.com/otp-provider.js...');
    const script = document.createElement('script');
    script.id = 'msg91-verify-script';
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => console.log('[Frontend MSG91] Script loaded successfully.');
    script.onerror = (e) => console.error('[Frontend MSG91] Script load error:', e);
    document.body.appendChild(script);
  }, []);

  const formatIdentifier = (raw: string): string => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  };

  const handleWidgetSuccess = async (accessToken: string) => {
    setError('');
    setIsLoading(true);
    console.log('[Frontend MSG91] Sending POST /otp/widget/verify to backend...');
    console.log('[Frontend MSG91] Access token present:', !!accessToken);

    try {
      const res = await fetch(`${API_BASE}/otp/widget/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      console.log('[Frontend MSG91] Backend /otp/widget/verify HTTP status:', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('[Frontend MSG91] Backend response fields:', Object.keys(data || {}));

      if (!res.ok) {
        throw new Error(data.message || 'MSG91 Custom UI authentication failed');
      }

      if (!data.tokens?.accessToken) {
        throw new Error('Authentication token not received from server');
      }

      const userProfile = {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        role: data.user.role,
        firstName: data.user.profile?.firstName || 'Customer',
        lastName: data.user.profile?.lastName || '',
      };

      setAuth(
        userProfile,
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      console.log('[Frontend MSG91] Customer authenticated successfully. Redirecting to home.');
      router.push('/');
    } catch (err: any) {
      console.error('[Frontend MSG91] Backend verification exception:', err?.message || err);
      setError(err.message || 'Widget verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
    const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '556022TLShucwZ86a6d8a7bP1';
    const identifier = formatIdentifier(phone);

    console.log('[Frontend MSG91] Dispatching sendOtp for identifier formatted (masked length):', identifier.length);

    // MSG91 Custom UI Configuration with exposeMethods: true
    const configuration = {
      widgetId,
      tokenAuth,
      identifier,
      exposeMethods: true,
      captchaRenderId: '',
      success: (data: any) => {
        console.log('[Frontend MSG91] verifyOtp SUCCESS callback triggered.');
        console.log('[Frontend MSG91] Success response keys:', Object.keys(data || {}));
        const token = typeof data === 'string' ? data : (data?.message || data?.jwtToken || data?.accessToken || data?.token);
        console.log('[Frontend MSG91] Verified access token present:', !!token);
        if (token) {
          handleWidgetSuccess(token);
        } else {
          console.error('[Frontend MSG91] No access token string in success response structure!');
          setError('Verification succeeded on MSG91, but token was missing.');
          setIsLoading(false);
        }
      },
      failure: (error: any) => {
        console.error('[Frontend MSG91] verifyOtp FAILURE callback triggered:', typeof error === 'object' ? Object.keys(error || {}) : error);
        setError(typeof error === 'string' ? error : (error?.message || 'OTP verification failed'));
        setIsLoading(false);
      },
    };

    if (typeof window !== 'undefined' && typeof (window as any).initSendOTP === 'function') {
      try {
        console.log('[Frontend MSG91] Initializing initSendOTP with exposeMethods: true...');
        (window as any).initSendOTP(configuration);

        if (typeof (window as any).sendOtp === 'function') {
          console.log('[Frontend MSG91] Calling window.sendOtp...');
          (window as any).sendOtp(identifier, (res: any) => {
            console.log('[Frontend MSG91] window.sendOtp success callback keys:', Object.keys(res || {}));
          }, (err: any) => {
            console.error('[Frontend MSG91] window.sendOtp failure callback:', err);
          });
        }

        setStep('OTP');
        setCooldown(30);
        setIsLoading(false);
        return;
      } catch (widgetErr: any) {
        console.warn('[Frontend MSG91] initSendOTP exception:', widgetErr?.message || widgetErr);
      }
    }

    // Dev mode / fallback flow
    try {
      console.log('[Frontend MSG91] Fallback: Calling POST /auth/send-otp...');
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP. Please try again.');
      }

      setStep('OTP');
      setCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Error sending OTP');
    } finally {
      setIsLoading(false);
    }
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

    console.log('[Frontend MSG91] Submitting OTP for verification (OTP length):', enteredOtp.length);

    // If MSG91 Custom UI verifyOtp method is exposed on window
    if (typeof window !== 'undefined' && typeof (window as any).verifyOtp === 'function') {
      try {
        console.log('[Frontend MSG91] Calling window.verifyOtp...');
        (window as any).verifyOtp(enteredOtp, (res: any) => {
          console.log('[Frontend MSG91] window.verifyOtp callback keys:', Object.keys(res || {}));
        }, (err: any) => {
          console.error('[Frontend MSG91] window.verifyOtp callback failure:', err);
        });
        return;
      } catch (verifyErr: any) {
        console.warn('[Frontend MSG91] Exception calling window.verifyOtp:', verifyErr?.message || verifyErr);
      }
    }

    // Dev mode / fallback API verification
    try {
      console.log('[Frontend MSG91] Fallback: Calling POST /auth/verify-otp...');
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: enteredOtp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP code');
      }

      if (!data.tokens?.accessToken) {
        throw new Error('Authentication token not received from server');
      }

      const userProfile = {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        role: data.user.role,
        firstName: data.user.profile?.firstName || 'Customer',
        lastName: data.user.profile?.lastName || '',
      };

      setAuth(
        userProfile,
        data.tokens.accessToken,
        data.tokens.refreshToken || data.tokens.accessToken,
      );

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code entered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
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
            <h2 className="text-2xl font-black text-gray-900">Authentication Temporarily Disabled</h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Customer sign in and registration screens are temporarily hidden during active development (`AUTH_ENABLED=false`). You can explore all FoodHub features directly.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-gray-900/10 transition hover:bg-gray-800"
            >
              <span>Return to FoodHub Home</span>
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
            {step === 'PHONE' ? 'Welcome to FoodHub' : 'Verify OTP Code'}
          </h2>
          <p className="text-xs text-gray-500">
            {step === 'PHONE'
              ? 'Enter your mobile number to receive a verification code'
              : `Enter the code sent to ${phone}`}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-600 border border-rose-100">
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Mobile Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 h-4 w-4 text-gray-400" />
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7006298795"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending OTP...' : 'Continue with MSG91 OTP'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-[10px] text-gray-400 leading-relaxed">
              By logging in, you agree to FoodHub's Terms of Service & Privacy Policy.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputsRef.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-14 w-14 rounded-2xl border-2 border-gray-200 text-center text-xl font-black text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isLoading ? 'Verifying...' : 'Verify & Login'}</span>
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => { setStep('PHONE'); setError(''); }}
                className="flex items-center gap-1 font-bold text-gray-500 hover:text-orange-600"
              >
                <Edit2 className="h-3.5 w-3.5" /> Change Number
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
        )}

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by MSG91 Official Custom UI & 256-bit SSL</span>
        </div>
      </div>
    </div>
  );
}
