'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, ArrowRight, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';
import { useMsg91Widget } from '../../hooks/use-msg91-widget';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { launchWidget, isWidgetLoading } = useMsg91Widget();

  const [phone, setPhone] = useState('+919876543210');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalDevOtp, setUseLocalDevOtp] = useState(false);
  const [devStep, setDevStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState(['4', '8', '1', '9']);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleContinueWithMsg91 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // Launch MSG91 Widget Popup
      let accessToken: string;
      try {
        accessToken = await launchWidget(phone);
      } catch (widgetErr: any) {
        // If MSG91 SDK is missing keys in dev mode, fallback to dev OTP flow automatically
        if (
          !process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ||
          widgetErr.message?.includes('SDK') ||
          widgetErr.message?.includes('not available')
        ) {
          console.warn('[MSG91 Dev Fallback] MSG91 Widget keys missing, executing local OTP flow...');
          await handleSendLocalOtp();
          setIsLoading(false);
          return;
        }
        throw widgetErr;
      }

      // Send MSG91 accessToken to backend POST /api/v1/auth/verify-otp
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed. Please try again.');
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
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLocalOtp = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP. Please try again.');
      }

      setUseLocalDevOtp(true);
      setDevStep('OTP');
      if (data.otp) {
        setDevOtp(data.otp);
      }
    } catch (err: any) {
      setError(err.message || 'Error sending local OTP');
    }
  };

  const handleVerifyLocalOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: enteredOtp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP');
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
      setError(err.message || 'Local OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {useLocalDevOtp && devStep === 'OTP' ? 'Verify Local OTP' : 'Welcome to FoodHub'}
          </h2>
          <p className="text-xs text-gray-500">
            {useLocalDevOtp && devStep === 'OTP'
              ? `Enter 4-digit OTP sent to ${phone}`
              : 'Enter your mobile number to sign in via MSG91 Instant OTP'}
          </p>
          {devOtp && useLocalDevOtp && (
            <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 py-1 px-3 rounded-lg inline-block">
              Demo OTP: {devOtp}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-600 border border-rose-100">
            {error}
          </div>
        )}

        {!useLocalDevOtp ? (
          <form onSubmit={handleContinueWithMsg91} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Mobile Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isWidgetLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <span>{isLoading || isWidgetLoading ? 'Launching MSG91 OTP...' : 'Continue with MSG91 OTP'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleSendLocalOtp()}
                className="text-xs font-bold text-gray-400 hover:text-orange-600 underline transition"
              >
                Use Local Dev OTP Mode (Offline)
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 leading-relaxed">
              By logging in, you agree to FoodHub's Terms of Service & Privacy Policy.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyLocalOtp} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = [...otp];
                    updated[idx] = val;
                    setOtp(updated);
                  }}
                  className="h-14 w-14 rounded-2xl border-2 border-gray-200 text-center text-xl font-black text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> {isLoading ? 'Verifying...' : 'Verify Local OTP'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setUseLocalDevOtp(false)}
                className="text-xs font-bold text-gray-400 hover:text-orange-600 underline"
              >
                Switch back to MSG91 Widget
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by MSG91 Widget SDK & 256-bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
}
