'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAuthEnabled } from '@foodhub/config';

export interface AdminUserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface AdminAuthState {
  user: AdminUserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const DEV_ADMIN_USER: AdminUserProfile = {
  id: 'admin-super-dev',
  email: 'admin@foodhub.com',
  role: 'SUPER_ADMIN',
  name: 'Super Admin (Dev Mode)',
};

const getInitialAuthState = () => {
  const authActive = isAuthEnabled();
  return {
    user: authActive ? null : DEV_ADMIN_USER,
    accessToken: authActive ? null : 'dev-admin-access-token',
    refreshToken: authActive ? null : 'dev-admin-refresh-token',
    isAuthenticated: !authActive,
  };
};

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      ...getInitialAuthState(),

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodhub-admin-auth');
        }
        const authActive = isAuthEnabled();
        set({
          user: authActive ? null : DEV_ADMIN_USER,
          accessToken: authActive ? null : 'dev-admin-access-token',
          refreshToken: authActive ? null : 'dev-admin-refresh-token',
          isAuthenticated: !authActive,
        });
      },
    }),
    {
      name: 'foodhub-admin-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    },
  ),
);
