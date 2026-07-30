'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/use-auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStep('OTP');
    setCooldown(60);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    // Mock Login Success
    setAuth(
      {
        id: 'usr-customer-1',
        phone,
        role: 'CUSTOMER',
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul.sharma@example.com',
      },
      'access-token-xyz',
      'refresh-token-xyz',
    );

    router.push('/');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {step === 'PHONE' ? 'Welcome to FoodHub' : 'Verify Mobile Number'}
          </h2>
          <p className="text-xs text-gray-500">
            {step === 'PHONE'
              ? 'Enter your mobile number to receive a 4-digit login OTP'
              : `Enter 4-digit OTP sent to ${phone}`}
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700"
            >
              <span>Get OTP</span>
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700"
            >
              <CheckCircle2 className="h-4 w-4" /> Verify & Login
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="font-bold text-gray-500 hover:underline"
              >
                Change Number
              </button>

              <button
                type="button"
                disabled={cooldown > 0}
                onClick={() => setCooldown(60)}
                className={`font-bold ${cooldown > 0 ? 'text-gray-400' : 'text-orange-600 hover:underline'}`}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-[11px] text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Protected by MSG91 SMS & 256-bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
}
