'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/use-auth-store';
import { useSessionTimeout } from '@foodhub/hooks';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export function CustomerSessionGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, logout, updateUser } = useAuthStore();
  const hydrated = useRef(false);

  useSessionTimeout({
    portalName: 'customer',
    isAuthenticated,
    accessToken,
    logout,
    apiBaseUrl: API_BASE,
    loginPath: '/login',
    timeoutMs: 5 * 60 * 1000, // 5 minutes
  });

  // Hydrate latest Customer profile (incl. avatarUrl) from database on mount / auth restore
  useEffect(() => {
    if (!isAuthenticated || !accessToken || hydrated.current) return;
    hydrated.current = true;
    let alive = true;
    fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.profile) {
          updateUser({
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            avatarUrl: data.profile.avatarUrl || undefined,
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isAuthenticated, accessToken, updateUser]);

  return <>{children}</>;
}
