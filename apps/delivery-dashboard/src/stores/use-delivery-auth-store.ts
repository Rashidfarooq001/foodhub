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
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'foodhub-delivery-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    },
  ),
);
