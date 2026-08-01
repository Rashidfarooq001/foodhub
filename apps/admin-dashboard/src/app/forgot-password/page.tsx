'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-center">
          Forgot Password
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Reset your administrator password
        </p>

        {step === 1 && (
          <>
            <input
              type="text"
              placeholder="Registered Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-8 w-full rounded-xl border p-3"
            />

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-xl bg-purple-600 py-3 text-white"
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-8 w-full rounded-xl border p-3"
            />

            <button
              onClick={() => setStep(3)}
              className="mt-6 w-full rounded-xl bg-purple-600 py-3 text-white"
            >
              Verify OTP
            </button>

            <button className="mt-4 w-full text-sm text-purple-600">
              Resend OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-8 w-full rounded-xl border p-3"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-4 w-full rounded-xl border p-3"
            />

            <button
              className="mt-6 w-full rounded-xl bg-purple-600 py-3 text-white"
            >
              Reset Password
            </button>
          </>
        )}

        <button
          onClick={() => router.push('/login')}
          className="mt-8 w-full text-sm text-purple-600 hover:underline"
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}