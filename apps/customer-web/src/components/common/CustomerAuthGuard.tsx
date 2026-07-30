'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/use-auth-store';
import { AuthGuard } from '@foodhub/ui';

export function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthGuard
      isAuthenticated={isAuthenticated}
      userRole={user?.role || 'CUSTOMER'}
      allowedRoles={['CUSTOMER', 'SUPER_ADMIN']}
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
