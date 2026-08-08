'use client';

import React, { useEffect, useState } from 'react';

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  userRole?: string | null;
  isAuthenticated?: boolean;
  onUnauthorized?: (reason: 'UNAUTHENTICATED' | 'FORBIDDEN') => void;
  /** Optional: absolute URL to the Customer Web portal shown as escape button on 403 screen */
  customerPortalUrl?: string;
}

export function AuthGuard({
  children,
  allowedRoles,
  userRole,
  isAuthenticated,
  onUnauthorized,
  customerPortalUrl,
}: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedUserRole = (userRole || 'CUSTOMER').toUpperCase().trim();
  const normalizedAllowedRoles = allowedRoles?.map((r) => r.toUpperCase().trim());

  const isForbidden =
    Boolean(normalizedAllowedRoles && normalizedAllowedRoles.length > 0) &&
    Boolean(userRole) &&
    !normalizedAllowedRoles?.includes(normalizedUserRole);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      onUnauthorized?.('UNAUTHENTICATED');
      return;
    }

    if (isForbidden) {
      onUnauthorized?.('FORBIDDEN');
    }
  }, [mounted, isAuthenticated, isForbidden, onUnauthorized]);

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

  if (isForbidden) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="rounded-full bg-rose-100 p-4 text-rose-600 font-black text-2xl">403</div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-gray-500">You do not have permission to view this page.</p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="/"
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-gray-800"
          >
            Return to Home
          </a>
          {customerPortalUrl && (
            <a
              href={customerPortalUrl}
              className="rounded-xl border border-orange-500 bg-white px-6 py-2.5 text-sm font-bold text-orange-600 shadow-lg hover:bg-orange-50"
            >
              Go to Customer Portal
            </a>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
