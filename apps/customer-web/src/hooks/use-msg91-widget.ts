import { useState, useCallback } from 'react';

declare global {
  interface Window {
    initSendOTP?: (config: any, successCb?: any, failureCb?: any) => void;
    loadOtpProvider?: (config: any, successCb?: any, failureCb?: any) => void;
    sendOTP?: any;
    msg91Success?: (data: any) => void;
    msg91Failure?: (err: any) => void;
  }
}

export function useMsg91Widget() {
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);

  const launchWidget = useCallback(
    (phone: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        setIsWidgetLoading(true);

        const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '';
        const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || '';

        const cleanPhone = phone.replace(/\D/g, '');
        const identifier = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const onSuccess = (data: any) => {
          setIsWidgetLoading(false);
          const token =
            typeof data === 'string'
              ? data
              : data?.message || data?.accessToken || data?.data || data?.token || data?.jwt;
          if (token) {
            resolve(token);
          } else {
            reject(new Error('MSG91 Widget did not return an access token'));
          }
        };

        const onFailure = (error: any) => {
          setIsWidgetLoading(false);
          const errMsg =
            typeof error === 'string'
              ? error
              : error?.message || 'MSG91 Widget authentication cancelled or failed';
          reject(new Error(errMsg));
        };

        if (typeof window !== 'undefined') {
          window.msg91Success = onSuccess;
          window.msg91Failure = onFailure;
        }

        const configuration = {
          widgetId,
          tokenAuth,
          identifier,
          exposeMethods: true,
          success: onSuccess,
          failure: onFailure,
          callback: onSuccess,
          onSuccess,
          onFailure,
        };

        if (typeof window !== 'undefined' && typeof window.initSendOTP === 'function') {
          try {
            window.initSendOTP(configuration, onSuccess, onFailure);
          } catch (e: any) {
            setIsWidgetLoading(false);
            reject(e);
          }
        } else if (typeof window !== 'undefined' && typeof window.loadOtpProvider === 'function') {
          try {
            window.loadOtpProvider(configuration, onSuccess, onFailure);
          } catch (e: any) {
            setIsWidgetLoading(false);
            reject(e);
          }
        } else {
          setIsWidgetLoading(false);
          reject(new Error('MSG91 Widget SDK is not available'));
        }
      });
    },
    [],
  );

  return { launchWidget, isWidgetLoading };
}
