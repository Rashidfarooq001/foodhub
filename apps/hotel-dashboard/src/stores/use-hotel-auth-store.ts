'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAuthEnabled } from '@foodhub/config';

export interface HotelUserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  restaurantId?: string;
  applicationStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
}

interface HotelAuthState {
  user: HotelUserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: HotelUserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const DEV_HOTEL_USER: HotelUserProfile = {
  id: 'hotel-owner-dev',
  email: 'owner@spicegarden.com',
  role: 'RESTAURANT_OWNER',
  name: 'Spice Garden Owner (Dev Mode)',
  restaurantId: 'rest-spice-garden-id',
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

export const useHotelAuthStore = create<HotelAuthState>()(
  persist(
    (set) => ({
      ...getInitialAuthState(),

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodhub-hotel-auth');
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
      name: 'foodhub-hotel-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
    },
  ),
);
