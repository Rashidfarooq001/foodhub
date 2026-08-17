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

  return (
    <QueryClientProvider client={queryClient}>
      {!splashDone && <ZaykaFoodSplash onComplete={() => setSplashDone(true)} />}
      <CustomerSessionGuard>{children}</CustomerSessionGuard>
    </QueryClientProvider>
  );
}
