'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface HotelUserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  restaurantId?: string;
  restaurantName?: string;
  applicationStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
}

interface HotelAuthState {
  user: HotelUserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: HotelUserProfile, accessToken: string, refreshToken: string) => void;
  updateUser: (profile: Partial<HotelUserProfile>) => void;
  logout: () => void;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useHotelAuthStore = create<HotelAuthState>()(
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
          user: state.user ? { ...state.user, ...profile } : state.user,
        })),

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
