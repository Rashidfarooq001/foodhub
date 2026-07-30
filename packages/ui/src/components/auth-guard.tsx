'use client';

import React, { useEffect, useState } from 'react';

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  userRole?: string | null;
  isAuthenticated?: boolean;
  onUnauthorized?: (reason: 'UNAUTHENTICATED' | 'FORBIDDEN') => void;
}

export function AuthGuard({
  children,
  allowedRoles,
  userRole,
  isAuthenticated,
  onUnauthorized,
}: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      onUnauthorized?.('UNAUTHENTICATED');
      return;
    }

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      onUnauthorized?.('FORBIDDEN');
    }
  }, [mounted, isAuthenticated, userRole, allowedRoles, onUnauthorized]);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
        <p className="text-sm text-gray-500">Please log in to access this page.</p>
        <a
          href="/login"
          className="rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700"
        >
          Go to Login
        </a>
      </div>
    );
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="rounded-full bg-rose-100 p-4 text-rose-600 font-black text-2xl">403</div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-gray-500">You do not have permission to view this dashboard.</p>
        <a
          href="/"
          className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-gray-800"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
