'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      updateUser: (profile) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
        })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodhub-customer-auth');
          localStorage.removeItem('foodhub-customer-cart');
          localStorage.removeItem('foodhub-cart-storage');
          localStorage.removeItem('foodhub-customer-address');
          sessionStorage.clear();
        }
        // Clear active cart store
        try {
          useCartStore.getState().clearCart();
        } catch {
          /* ignore */
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'foodhub-customer-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
