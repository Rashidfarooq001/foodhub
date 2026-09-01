'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  Lock,
  CheckCircle2,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { getApiBaseUrl, isAuthEnabled } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotStep, setForgotStep] = useState<'SEND_OTP' | 'VERIFY_OTP' | 'NEW_PASSWORD'>(
    'SEND_OTP',
  );
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

  const handleSendResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number');
      return;
    }

    // INVALIDATE PREVIOUS VERIFICATION & TOKEN STATE ON RESEND
    setResetToken('');
    setOtp(['', '', '', '']);
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to request reset OTP.');
      }

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
        success: (msgData: any) => {
          const token =
            typeof msgData === 'string'
              ? msgData
              : msgData?.message || msgData?.jwtToken || msgData?.accessToken || msgData?.token;
          if (token) {
            handleVerifyResetWidgetToken(token);
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
              (err: any) => console.error('[MSG91 Reset] sendOtp error:', err),
            );
          }
        } catch (widgetErr: any) {
          console.warn('[MSG91 Reset] initSendOTP exception:', widgetErr);
        }
      }

      setForgotStep('VERIFY_OTP');
      setCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Error requesting reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetWidgetToken = async (accessToken: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          phone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Password reset OTP verification failed.');
      }

      setResetToken(data.resetToken);
      setSuccessMsg('OTP verified successfully! Please enter your new password.');
      setForgotStep('NEW_PASSWORD');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
      setForgotStep('VERIFY_OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtpManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter the 4-digit OTP code');
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
        console.warn('[MSG91 Reset] verifyOtp exception:', verifyErr);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: enteredOtp,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed.');
      }

      setResetToken(data.resetToken);
      setSuccessMsg('OTP verified successfully! Please enter your new password.');
      setForgotStep('NEW_PASSWORD');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!resetToken) {
      setError('Password reset token expired. Please verify OTP again.');
      setForgotStep('SEND_OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to set new password.');
      }

      setSuccessMsg('Password updated successfully! Logging you in...');

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

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Password update failed.');
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
              Password reset screens are temporarily hidden during active development.
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
          <h2 className="text-2xl font-black text-gray-900">Reset Customer Password</h2>
          <p className="text-xs text-gray-500">
            {forgotStep === 'SEND_OTP'
              ? 'Enter your registered mobile number for password reset'
              : forgotStep === 'VERIFY_OTP'
                ? 'Enter 4-digit SMS OTP sent to your mobile number'
                : 'Create a new secure password for your account'}
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

        {forgotStep === 'SEND_OTP' ? (
          <form onSubmit={handleSendResetOtp} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Registered Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
              <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-orange-600">
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : forgotStep === 'VERIFY_OTP' ? (
          <form onSubmit={handleVerifyResetOtpManual} className="space-y-5">
            <div className="rounded-2xl bg-orange-50 p-3 text-center border border-orange-100">
              <p className="text-xs font-bold text-orange-900">Verify Password Reset Mobile</p>
              <p className="text-[11px] text-orange-700 mt-0.5">
                OTP code sent to <span className="font-black">+{phone.replace(/\D/g, '')}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 text-center">
                Enter 4-Digit MSG91 OTP
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
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
              <span>{isLoading ? 'Verifying OTP...' : 'Verify OTP & Set New Password'}</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotStep('SEND_OTP');
                  setError('');
                }}
                className="flex items-center gap-1 font-bold text-gray-500 hover:text-orange-600"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit Mobile Number
              </button>

              {cooldown > 0 ? (
                <span className="font-bold text-gray-400">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendResetOtp()}
                  className="flex items-center gap-1 font-bold text-orange-600 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Resend OTP
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleSetNewPasswordSubmit} className="space-y-5" autoComplete="off">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center border border-emerald-100">
              <p className="text-xs font-bold text-emerald-900">Mobile Verified Successfully</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Please create a new password for{' '}
                <span className="font-black">+{phone.replace(/\D/g, '')}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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
              <span>{isLoading ? 'Updating Password...' : 'Save New Password & Login'}</span>
            </button>
          </form>
        )}

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by ZaykaFood 256-bit SSL Session Management</span>
        </div>
      </div>
    </div>
  );
}
