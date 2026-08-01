import { useState, useCallback } from 'react';

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    loadOtpProvider?: (config: any) => void;
    sendOTP?: any;
  }
}

export function useMsg91Widget() {
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);

  const launchWidget = useCallback(
    (phone: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        setIsWidgetLoading(true);

        const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
        const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN;

        const cleanPhone = phone.replace(/\D/g, '');
        const identifier = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const configuration = {
          widgetId: widgetId || '',
          tokenAuth: tokenAuth || '',
          identifier,
          exposeMethods: true,
          success: (data: any) => {
            setIsWidgetLoading(false);
            const token =
              typeof data === 'string'
                ? data
                : data?.message || data?.accessToken || data?.data || data?.jwt;
            if (token) {
              resolve(token);
            } else {
              reject(new Error('MSG91 Widget did not return an access token'));
            }
          },
          failure: (error: any) => {
            setIsWidgetLoading(false);
            const errMsg =
              typeof error === 'string'
                ? error
                : error?.message || 'MSG91 Widget authentication cancelled or failed';
            reject(new Error(errMsg));
          },
        };

        if (typeof window !== 'undefined' && window.initSendOTP) {
          try {
            window.initSendOTP(configuration);
            setTimeout(() => setIsWidgetLoading(false), 600);
          } catch (e: any) {
            setIsWidgetLoading(false);
            reject(e);
          }
        } else if (typeof window !== 'undefined' && window.loadOtpProvider) {
          try {
            window.loadOtpProvider(configuration);
            setTimeout(() => setIsWidgetLoading(false), 600);
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
