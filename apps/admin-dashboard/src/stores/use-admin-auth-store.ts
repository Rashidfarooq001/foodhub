'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAuthEnabled } from '@foodhub/config';

export interface AdminUserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AdminAuthState {
  user: AdminUserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUserProfile, accessToken: string, refreshToken: string) => void;
  updateUser: (profile: Partial<AdminUserProfile>) => void;
  logout: () => void;
}

const DEV_ADMIN_USER: AdminUserProfile = {
  id: '3f2a1b1b-c4d1-4318-8aee-dc67a99975a5',
  email: 'www.rashidreshi2005@gmail.com',
  role: 'SUPER_ADMIN',
  name: 'Rashid Reshi',
  phone: '+917006298795',
};

const getInitialAuthState = () => {
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
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

      updateUser: (profile) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...profile }
            : ({ ...DEV_ADMIN_USER, ...profile } as AdminUserProfile),
        })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodhub-admin-auth');
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'foodhub-admin-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    },
  ),
);
