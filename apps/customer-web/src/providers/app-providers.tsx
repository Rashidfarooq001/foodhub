'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerSessionGuard } from './customer-session-guard';
import { ZaykaFoodSplash } from '../components/layout/ZaykaFoodSplash';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [splashDone, setSplashDone] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('nosplash') === '1' || sessionStorage.getItem('zayka_splash_shown') === '1') {
        setSplashDone(true);
      }
    }
  }, []);

  const handleSplashComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('zayka_splash_shown', '1');
    }
    setSplashDone(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {!splashDone && <ZaykaFoodSplash onComplete={handleSplashComplete} />}
      <CustomerSessionGuard>{children}</CustomerSessionGuard>
    </QueryClientProvider>
  );
}
