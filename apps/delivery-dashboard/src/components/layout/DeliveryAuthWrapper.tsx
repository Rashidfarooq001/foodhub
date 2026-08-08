'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDeliveryAuthStore } from '../../stores/use-delivery-auth-store';
import { AuthGuard } from '@foodhub/ui';

export function DeliveryAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useDeliveryAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthGuard
      isAuthenticated={isAuthenticated}
      userRole={user?.role || null}
      allowedRoles={['DELIVERY_PARTNER', 'DRIVER', 'SUPER_ADMIN']}
      customerPortalUrl={process.env.NEXT_PUBLIC_CUSTOMER_WEB_URL || 'http://localhost:3000'}
      onUnauthorized={(reason) => {
        if (reason === 'UNAUTHENTICATED') {
          router.push('/login');
        }
      }}
    >
      {children}
    </AuthGuard>
  );
}
