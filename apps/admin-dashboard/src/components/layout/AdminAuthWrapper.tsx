'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../../stores/use-admin-auth-store';
import { AuthGuard } from '@foodhub/ui';

export function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuthStore();
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthGuard
      isAuthenticated={isAuthenticated}
      userRole={user?.role || null}
      allowedRoles={['ADMIN', 'SUPER_ADMIN']}
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
