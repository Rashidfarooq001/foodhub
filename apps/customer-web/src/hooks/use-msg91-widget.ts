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

        const envWidgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
        const envTokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN;

        console.log('MSG91 Env check - NEXT_PUBLIC_MSG91_WIDGET_ID:', envWidgetId);
        console.log('MSG91 Env check - NEXT_PUBLIC_MSG91_WIDGET_TOKEN:', envTokenAuth);

        const widgetId = envWidgetId || '366861655a52353436333837';
        const tokenAuth = envTokenAuth || '556022TLShucwZ86a6d8a7bP1';

        console.log('MSG91 resolved widgetId:', widgetId);
        console.log('MSG91 resolved tokenAuth:', tokenAuth);

        const cleanPhone = phone.replace(/\D/g, '');
        const identifier = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const onSuccess = (data: any) => {
          console.log('MSG91 SUCCESS', data);
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
          console.error('MSG91 FAILURE', error);
          setIsWidgetLoading(false);
          const errMsg =
            typeof error === 'string'
              ? error
              : error?.message || 'MSG91 Widget verification cancelled or failed';
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

        console.log(
          'MSG91: window.initSendOTP exists?',
          typeof window !== 'undefined' ? typeof window.initSendOTP : 'undefined',
        );
        console.log('MSG91: starting', configuration);

        if (typeof window !== 'undefined' && typeof window.initSendOTP === 'function') {
          try {
            window.initSendOTP(configuration, onSuccess, onFailure);
          } catch (e: any) {
            console.error('MSG91: EXCEPTION in initSendOTP', e);
            setIsWidgetLoading(false);
            reject(e);
          }
        } else if (typeof window !== 'undefined' && typeof window.loadOtpProvider === 'function') {
          try {
            window.loadOtpProvider(configuration, onSuccess, onFailure);
          } catch (e: any) {
            console.error('MSG91: EXCEPTION in loadOtpProvider', e);
            setIsWidgetLoading(false);
            reject(e);
          }
        } else {
          console.error('MSG91: Widget SDK script not loaded on window object');
          setIsWidgetLoading(false);
          reject(new Error('MSG91 Widget SDK script not available on window object'));
        }
      });
    },
    [],
  );

  return { launchWidget, isWidgetLoading };
}
