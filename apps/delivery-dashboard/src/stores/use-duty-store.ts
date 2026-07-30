'use client';

import { create } from 'zustand';

export type DutyStatus = 'ONLINE' | 'OFFLINE' | 'BREAK' | 'BUSY';

interface DutyState {
  dutyStatus: DutyStatus;
  setDutyStatus: (status: DutyStatus) => void;
}

export const useDutyStore = create<DutyState>()((set) => ({
  dutyStatus: 'ONLINE',
  setDutyStatus: (status) => set({ dutyStatus: status }),
}));
