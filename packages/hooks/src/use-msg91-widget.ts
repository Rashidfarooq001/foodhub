'use client';

import { useState, useEffect } from 'react';

export interface UseMsg91WidgetOptions {
  onSuccess: (accessToken: string) => void;
  onFailure?: (error: any) => void;
  widgetId?: string;
  tokenAuth?: string;
}

export function useMsg91Widget(options: UseMsg91WidgetOptions) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('msg91-verify-script')) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'msg91-verify-script';
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = (e) => console.error('[MSG91 Hook] Script load error:', e);
    document.body.appendChild(script);
  }, []);

  const formatIdentifier = (raw: string): string => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  };

  const sendOtp = async (inputPhone: string) => {
    const cleanDigits = inputPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }

    setPhone(inputPhone);
    setError('');
    setIsLoading(true);

    const widgetId =
      options.widgetId ||
      process.env.NEXT_PUBLIC_MSG91_WIDGET_ID ||
      '3668626d5043313835303335';
    const tokenAuth =
      options.tokenAuth ||
      process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN ||
      process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH ||
      '556022TLShucwZ86a6d8a7bP1';
    const identifier = formatIdentifier(inputPhone);

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
          options.onSuccess(token);
        } else if (options.onFailure) {
          options.onFailure('Verification succeeded on MSG91, but token was missing.');
        }
      },
      failure: (err: any) => {
        const msg = typeof err === 'string' ? err : err?.message || 'OTP verification failed';
        setError(msg);
        setIsLoading(false);
        if (options.onFailure) options.onFailure(err);
      },
    };

    if (typeof window !== 'undefined' && typeof (window as any).initSendOTP === 'function') {
      try {
        (window as any).initSendOTP(configuration);
        if (typeof (window as any).sendOtp === 'function') {
          (window as any).sendOtp(
            identifier,
            () => {},
            (err: any) => console.error('[MSG91 Hook] sendOtp failure:', err),
          );
        }
        setStep('OTP');
        setCooldown(30);
        setIsLoading(false);
        return true;
      } catch (widgetErr: any) {
        console.warn('[MSG91 Hook] initSendOTP exception:', widgetErr?.message || widgetErr);
      }
    }

    setStep('OTP');
    setCooldown(30);
    setIsLoading(false);
    return true;
  };

  const verifyOtp = async (inputOtp: string) => {
    if (inputOtp.length < 4) {
      setError('Please enter the complete 4-digit OTP code');
      return;
    }
    setError('');
    setIsLoading(true);

    if (typeof window !== 'undefined' && typeof (window as any).verifyOtp === 'function') {
      try {
        (window as any).verifyOtp(
          inputOtp,
          () => {},
          (err: any) => {
            setError(typeof err === 'string' ? err : err?.message || 'OTP verification failed');
            setIsLoading(false);
          },
        );
        return;
      } catch (verifyErr: any) {
        console.warn('[MSG91 Hook] verifyOtp exception:', verifyErr?.message || verifyErr);
      }
    }
  };

  return {
    isScriptLoaded,
    step,
    setStep,
    phone,
    setPhone,
    otp,
    setOtp,
    error,
    setError,
    isLoading,
    setIsLoading,
    cooldown,
    sendOtp,
    verifyOtp,
  };
}
