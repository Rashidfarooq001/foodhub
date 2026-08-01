'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAuthEnabled } from '@foodhub/config';

export interface DeliveryUserProfile {
  id: string;
  email: string;
  phone: string;
  role: string;
  name?: string;
}

interface DeliveryAuthState {
  user: DeliveryUserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: DeliveryUserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const DEV_DELIVERY_USER: DeliveryUserProfile = {
  id: 'driver-vikram-1',
  email: 'driver@foodhub.com',
  phone: '+919876500999',
  role: 'DELIVERY_PARTNER',
  name: 'Vikram Singh (Dev Mode)',
};

const getInitialAuthState = () => {
  const authActive = isAuthEnabled();
  return {
    user: authActive ? null : DEV_DELIVERY_USER,
    accessToken: authActive ? null : 'dev-driver-access-token',
    refreshToken: authActive ? null : 'dev-driver-refresh-token',
    isAuthenticated: !authActive,
  };
};

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useDeliveryAuthStore = create<DeliveryAuthState>()(
  persist(
    (set) => ({
      ...getInitialAuthState(),

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodhub-delivery-auth');
        }
        const authActive = isAuthEnabled();
        set({
          user: authActive ? null : DEV_DELIVERY_USER,
          accessToken: authActive ? null : 'dev-driver-access-token',
          refreshToken: authActive ? null : 'dev-driver-refresh-token',
          isAuthenticated: !authActive,
        });
      },
    }),
    {
      name: 'foodhub-delivery-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    },
  ),
);
