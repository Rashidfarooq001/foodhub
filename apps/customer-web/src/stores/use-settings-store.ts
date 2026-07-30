'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  isVegOnly: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  theme: 'light' | 'dark';
  toggleVegOnly: () => void;
  togglePush: () => void;
  toggleSms: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isVegOnly: false,
      pushEnabled: true,
      smsEnabled: true,
      theme: 'light',

      toggleVegOnly: () => set((state) => ({ isVegOnly: !state.isVegOnly })),
      togglePush: () => set((state) => ({ pushEnabled: !state.pushEnabled })),
      toggleSms: () => set((state) => ({ smsEnabled: !state.smsEnabled })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'foodhub-customer-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
