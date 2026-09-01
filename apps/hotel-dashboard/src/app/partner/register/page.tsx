'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleMapPicker } from '../../../components/map/GoogleMapPicker';
import {
  UtensilsCrossed,
  Store,
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Image as ImageIcon,
  FileText,
  Lock,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  Check,
  Navigation,
} from 'lucide-react';
import { MediaUploader } from '../../../components/common/MediaUploader';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function RestaurantPartnerRegisterPage() {
  const router = useRouter();

  // Form State
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    description: '',
    fssaiLicense: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pin: '',
    latitude: null as number | null,
    longitude: null as number | null,
    cuisines: 'North Indian, Biryani',
    openingHours: '09:00',
    closingHours: '23:00',
    logoUrl: '',
    bannerUrl: '',
    menuUrl: '',
    fssaiUrl: '',
    panUrl: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

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

  // OTP Verification State (MSG91 Widget)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocatingOwner, setIsLocatingOwner] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);

  const handleGetOwnerLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg(
        'Geolocation is not supported by your browser device. Please enter address manually.',
      );
      return;
    }

    setIsLocatingOwner(true);
    setLocationStatusMsg('Acquiring real-time GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        try {
          const geoRes = await fetch(
            `${API_BASE}/geolocation/reverse-geocode?lat=${lat}&lng=${lng}`,
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addrText =
              typeof geoData === 'string' ? geoData : geoData.address || geoData.displayName || '';
            if (addrText) {
              setForm((prev) => ({
                ...prev,
                address: addrText,
              }));
            }
          }
        } catch {
          /* geocode fallback */
        }

        setIsLocatingOwner(false);
        setLocationStatusMsg(`GPS Location captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        setIsLocatingOwner(false);
        setLocationStatusMsg(
          'Location permission denied or unavailable. Please enable location or enter address manually.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const formatIdentifier = (raw: string): string => {
    const cleaned = raw.replace(/\D/g, '');
    return cleaned.length === 10 ? `91${cleaned}` : cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'phone') {
      setIsPhoneVerified(false);
      setShowOtpInput(false);
    }
  };

  // Launch MSG91 Widget & Trigger OTP
  const handleVerifyPhoneWithWidget = async () => {
    const cleanDigits = form.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit owner mobile number');
      return;
    }
    setErrorMsg(null);
    setIsVerifyingPhone(true);

    try {
      // 1. Check phone availability
      const checkRes = await fetch(`${API_BASE}/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits }),
      });

      const checkData = await checkRes.json().catch(() => ({}));
      if (!checkRes.ok || checkData.available === false) {
        throw new Error(
          checkData.message ||
            'An account with this phone number already exists. Please use the correct login portal.',
        );
      }

      // 2. Configure & Trigger MSG91 OTP Widget
      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '3668626d5043313835303335';
      const tokenAuth =
        process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN ||
        process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH ||
        '556022TLShucwZ86a6d8a7bP1';
      const identifier = formatIdentifier(form.phone);

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
            handleBackendWidgetVerification(token);
          } else {
            setErrorMsg('Verification succeeded on MSG91, but verification token was missing.');
            setIsVerifyingPhone(false);
            setIsVerifyingOtp(false);
          }
        },
        failure: (err: any) => {
          setErrorMsg(
            typeof err === 'string'
              ? err
              : err?.message || 'Phone verification failed. Please try again.',
          );
          setIsVerifyingPhone(false);
          setIsVerifyingOtp(false);
        },
      };

      if (typeof window !== 'undefined' && typeof (window as any).initSendOTP === 'function') {
        try {
          (window as any).initSendOTP(configuration);
          if (typeof (window as any).sendOtp === 'function') {
            (window as any).sendOtp(
              identifier,
              () => {},
              (err: any) => {
                console.error('[MSG91 Restaurant] sendOtp error:', err);
              },
            );
          }
        } catch (widgetErr: any) {
          console.warn('[MSG91 Restaurant] initSendOTP exception:', widgetErr);
        }
      }

      // Open OTP Input interface immediately upon triggering SMS
      setShowOtpInput(true);
      setResendCooldown(30);
      setIsVerifyingPhone(false);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Phone verification initialization failed.');
      setIsVerifyingPhone(false);
    }
  };

  // Secure Backend Verification of MSG91 Widget Token
  const handleBackendWidgetVerification = async (accessToken: string) => {
    setErrorMsg(null);
    setIsVerifyingOtp(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-registration-widget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          phone: form.phone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.verified) {
        throw new Error(data.message || 'Phone verification failed.');
      }

      setIsPhoneVerified(true);
      setShowOtpInput(false);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Phone verification failed after widget verification.');
      setIsPhoneVerified(false);
    } finally {
      setIsVerifyingPhone(false);
      setIsVerifyingOtp(false);
    }
  };

  // Submit entered OTP
  const handleVerifyOtpSubmit = async () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 4) {
      setErrorMsg('Please enter the complete 4-digit OTP code');
      return;
    }

    setErrorMsg(null);
    setIsVerifyingOtp(true);

    // 1. Try MSG91 Widget JS SDK verifyOtp
    if (typeof window !== 'undefined' && typeof (window as any).verifyOtp === 'function') {
      try {
        (window as any).verifyOtp(
          enteredOtp,
          () => {},
          (err: any) => {
            setErrorMsg(
              typeof err === 'string'
                ? err
                : err?.message || 'Incorrect OTP entered. Please try again.',
            );
            setIsVerifyingOtp(false);
          },
        );
        return;
      } catch (verifyErr: any) {
        console.warn('[MSG91 Restaurant] verifyOtp exception:', verifyErr);
      }
    }

    // 2. Direct Backend fallback verification
    try {
      const res = await fetch(`${API_BASE}/auth/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          otp: enteredOtp,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.verified) {
        setIsPhoneVerified(true);
        setShowOtpInput(false);
        setErrorMsg(null);
      } else {
        throw new Error(data.message || 'Incorrect OTP code entered.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Phone verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setResendCooldown(30);
    const identifier = formatIdentifier(form.phone);

    if (typeof window !== 'undefined' && typeof (window as any).retryOtp === 'function') {
      (window as any).retryOtp();
    } else if (typeof window !== 'undefined' && typeof (window as any).sendOtp === 'function') {
      (window as any).sendOtp(
        identifier,
        () => {},
        (err: any) => console.error(err),
      );
    }
  };

  const handleCancelOtp = () => {
    setShowOtpInput(false);
    setIsVerifyingPhone(false);
    setIsVerifyingOtp(false);
    setOtpDigits(['', '', '', '']);
    setErrorMsg(null);
  };

  // 3. Complete Application Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // COMPULSORY FIELD VALIDATION
    if (!form.name.trim()) {
      setErrorMsg('Please enter Restaurant Name (*)');
      return;
    }
    if (!form.ownerName.trim()) {
      setErrorMsg('Please enter Restaurant Owner Name (*)');
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit Phone Number (*)');
      return;
    }
    if (!isPhoneVerified) {
      setErrorMsg('Phone number must be verified via OTP before submitting application.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setErrorMsg('Please enter a valid Email Address (*)');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long (*)');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match');
      return;
    }
    if (!form.fssaiLicense.trim()) {
      setErrorMsg('FSSAI License Number is compulsory (*)');
      return;
    }

    // MANDATORY DOCUMENT CHECKS
    if (!form.menuUrl) {
      setErrorMsg('Please upload Restaurant Menu (*)');
      return;
    }
    if (!form.bannerUrl && !form.logoUrl) {
      setErrorMsg('Please upload at least one Restaurant Visual / Banner Photo (*)');
      return;
    }
    if (!form.fssaiUrl) {
      setErrorMsg('Please upload FSSAI License Document (*)');
      return;
    }
    if (!form.panUrl) {
      setErrorMsg('Please upload PAN Card Document (*)');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.ownerName.trim() || form.name.trim(),
        phone: `+91${form.phone.replace(/\D/g, '')}`,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        restaurantName: form.name.trim(),
        addressLine: form.address.trim() || 'Restaurant Address',
        city: form.city || 'Bandipora',
        state: form.state || 'Jammu & Kashmir',
        postalCode: form.pin || '193502',
        latitude: form.latitude ?? 0,
        longitude: form.longitude ?? 0,
        fssaiNumber: form.fssaiLicense.trim() || undefined,
        gstin: form.panNumber.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/auth/register/restaurant-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.tokens?.accessToken) {
          localStorage.setItem('foodhub_hotel_token', data.tokens.accessToken);
          localStorage.setItem('foodhub_hotel_refresh_token', data.tokens.refreshToken || '');
        }
        setSubmitted(true);
      } else {
        throw new Error(data.message || 'Failed to submit application. Please check form details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error while submitting application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900">Application Submitted!</h1>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your restaurant partnership application has been received and is currently under
              review by ZaykaFood Operations.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 space-y-1">
            <p className="uppercase tracking-wider text-[10px] text-amber-700 font-black">
              Application Status
            </p>
            <p className="text-sm font-black text-amber-800">PENDING ADMIN APPROVAL</p>
          </div>

          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-7 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700"
            >
              <span>Merchant Portal Login</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 text-white">
          <div className="mx-auto flex justify-center mb-4">
            <img src="/zaykafood-logo.png" alt="ZaykaFood" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black">Become a ZaykaFood Partner</h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Register your restaurant, upload required documents &amp; start receiving orders upon
            Admin approval
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700 shadow-md">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: OWNER & RESTAURANT PROFILE */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-base font-black text-gray-900 border-b border-gray-100 pb-4">
              <Store className="h-5 w-5 text-orange-600" /> 1. Owner &amp; Restaurant Basic Info
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Restaurant Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Royal Biryani House"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Restaurant Owner Name <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Full legal owner name"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Phone & OTP Verification */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Phone Number <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      disabled={isPhoneVerified}
                      className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none disabled:bg-gray-100"
                    />
                  </div>
                  {!isPhoneVerified ? (
                    <button
                      type="button"
                      onClick={handleVerifyPhoneWithWidget}
                      disabled={isVerifyingPhone}
                      className="rounded-2xl bg-orange-600 px-4 py-3.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 shrink-0"
                    >
                      {isVerifyingPhone ? 'Verifying...' : 'Verify Phone Number'}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 shrink-0">
                      <Check className="h-4 w-4" /> Verified
                    </span>
                  )}
                </div>
              </div>

              {/* OTP Verification Card */}
              {showOtpInput && !isPhoneVerified && (
                <div className="col-span-1 sm:col-span-2 rounded-2xl bg-orange-50/80 p-5 border border-orange-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-orange-900">
                      <Phone className="h-4 w-4 text-orange-600" /> Enter MSG91 Verification OTP
                    </div>
                    <span className="text-[11px] font-bold text-orange-700">
                      Sent to +91{form.phone.replace(/\D/g, '')}
                    </span>
                  </div>

                  <div className="flex flex-col items-center space-y-3">
                    <div className="flex justify-center gap-3">
                      {otpDigits.map((digit, idx) => (
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
                            const next = [...otpDigits];
                            next[idx] = e.target.value.substring(e.target.value.length - 1);
                            setOtpDigits(next);
                            if (e.target.value && idx < 3) otpInputsRef.current[idx + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                              otpInputsRef.current[idx - 1]?.focus();
                            }
                          }}
                          disabled={isVerifyingOtp}
                          className="h-12 w-12 rounded-2xl border-2 border-gray-300 text-center text-lg font-black text-gray-900 focus:border-orange-500 focus:outline-none bg-white shadow-sm disabled:bg-gray-100"
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 w-full max-w-xs pt-1">
                      <button
                        type="button"
                        onClick={handleVerifyOtpSubmit}
                        disabled={isVerifyingOtp || otpDigits.join('').length < 4}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-700 disabled:opacity-50 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelOtp}
                        disabled={isVerifyingOtp}
                        className="rounded-xl bg-gray-200 px-3 py-3 text-xs font-bold text-gray-700 hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                      {resendCooldown > 0 ? (
                        <span>
                          Resend OTP in{' '}
                          <strong className="text-orange-600">{resendCooldown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="font-bold text-orange-600 hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Create Password <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Confirm Password <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: MANDATORY DOCUMENTS & VISUALS */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-base font-black text-gray-900 border-b border-gray-100 pb-4">
              <FileText className="h-5 w-5 text-orange-600" /> 2. Mandatory Documents &amp; Visuals
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  FSSAI License Number <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="fssaiLicense"
                  required
                  value={form.fssaiLicense}
                  onChange={handleChange}
                  placeholder="14-digit FSSAI License No."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  PAN Card Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                  placeholder="10-character PAN No."
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <MediaUploader
                label="FSSAI License Document (PDF, JPG, PNG) *"
                acceptType="image"
                value={form.fssaiUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, fssaiUrl: url }))}
              />

              <MediaUploader
                label="PAN Card Document (PDF, JPG, PNG) *"
                acceptType="image"
                value={form.panUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, panUrl: url }))}
              />

              <MediaUploader
                label="Restaurant Menu Document / Photo *"
                acceptType="image"
                value={form.menuUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, menuUrl: url }))}
              />

              <MediaUploader
                label="Restaurant Store Logo / Profile Avatar *"
                acceptType="image"
                value={form.logoUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
              />

              <MediaUploader
                label="Restaurant Visuals / Store Cover Photo *"
                acceptType="image"
                value={form.bannerUrl}
                onChange={(url) =>
                  setForm((prev) => ({ ...prev, bannerUrl: url, logoUrl: prev.logoUrl || url }))
                }
              />
            </div>
          </div>

          {/* SECTION 3: STORE ADDRESS & LOCATION */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-base font-black text-gray-900">
                <MapPin className="h-5 w-5 text-orange-600" /> 3. Store Physical Location &amp; GPS
                Coordinates
              </div>

              <button
                type="button"
                onClick={handleGetOwnerLocation}
                disabled={isLocatingOwner}
                className="flex items-center gap-1.5 rounded-2xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition"
              >
                <Navigation className={`h-3.5 w-3.5 ${isLocatingOwner ? 'animate-spin' : ''}`} />
                <span>{isLocatingOwner ? 'Locating...' : 'Use Current Location'}</span>
              </button>
            </div>

            {locationStatusMsg && (
              <div
                className={`rounded-2xl p-3 text-xs font-bold border ${
                  locationStatusMsg.includes('captured')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                ℹ️ {locationStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Door No, Street Name, Area / Locality"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  City / Area *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Sopore / Srinagar / City Name"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  State / PIN Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-1/2 rounded-2xl border border-gray-200 px-3 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="pin"
                    value={form.pin}
                    onChange={handleChange}
                    placeholder="PIN Code"
                    className="w-1/2 rounded-2xl border border-gray-200 px-3 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Store Location
                </label>
                <p className="text-[10px] text-gray-500 mb-3">
                  Drag the pin to exactly where your store is located.
                </p>

                <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200">
                  <GoogleMapPicker
                    initialLat={form.latitude ?? 0}
                    initialLng={form.longitude ?? 74.5221}
                    onLocationChange={(lat, lng) =>
                      setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                    }
                  />
                </div>

                {form.latitude && form.longitude && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Location Captured
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Cuisines Offered
                </label>
                <input
                  type="text"
                  name="cuisines"
                  value={form.cuisines}
                  onChange={handleChange}
                  placeholder="North Indian, Chinese, Fast Food"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Opening / Closing Time
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="openingHours"
                    value={form.openingHours}
                    onChange={handleChange}
                    placeholder="09:00"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none text-center"
                  />
                  <span className="text-xs font-bold text-gray-400">to</span>
                  <input
                    type="text"
                    name="closingHours"
                    value={form.closingHours}
                    onChange={handleChange}
                    placeholder="23:00"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 hover:from-orange-700 hover:to-amber-600 disabled:opacity-50 transition"
          >
            <span>
              {isSubmitting
                ? 'Submitting Application...'
                : 'Submit Restaurant Registration Application'}
            </span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
