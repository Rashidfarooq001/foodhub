'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAuthEnabled } from '@foodhub/config';
import { useCartStore } from './use-cart-store';

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  updateUser: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

const DEV_GUEST_USER: UserProfile = {
  id: 'guest-customer-dev',
  phone: '+919876543210',
  role: 'CUSTOMER',
  firstName: 'Guest',
  lastName: 'User',
};

const getInitialAuthState = () => {
  const authActive = isAuthEnabled();
  return {
    user: authActive ? null : DEV_GUEST_USER,
    accessToken: authActive ? null : 'dev-guest-access-token',
    refreshToken: authActive ? null : 'dev-guest-refresh-token',
    isAuthenticated: !authActive,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...getInitialAuthState(),

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      updateUser: (profile) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : DEV_GUEST_USER,
        })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodhub-customer-auth');
          localStorage.removeItem('foodhub-customer-cart');
          localStorage.removeItem('foodhub-cart-storage');
          localStorage.removeItem('foodhub-customer-address');
          sessionStorage.clear();
        }
        try {
          useCartStore.getState().clearCart();
        } catch {
          /* ignore */
        }
        const authActive = isAuthEnabled();
        set({
          user: authActive ? null : DEV_GUEST_USER,
          accessToken: authActive ? null : 'dev-guest-access-token',
          refreshToken: authActive ? null : 'dev-guest-refresh-token',
          isAuthenticated: !authActive,
        });
      },
    }),
    {
      name: 'foodhub-customer-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
