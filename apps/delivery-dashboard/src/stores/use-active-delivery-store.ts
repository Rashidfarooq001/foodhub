'use client';

import { create } from 'zustand';
import { DeliveryJob } from '../data/delivery-mock-data';

interface ActiveDeliveryState {
  currentJob: DeliveryJob | null;
  setCurrentJob: (job: DeliveryJob | null) => void;
  completeDelivery: () => void;
  markPickedUp: () => void;
  acceptNewJob: (job: DeliveryJob) => void;
}

export const useActiveDeliveryStore = create<ActiveDeliveryState>()((set, get) => ({
  // Starts empty — pages fetch from backend
  currentJob: null,

  setCurrentJob: (job) => set({ currentJob: job }),

  completeDelivery: () => {
    set({ currentJob: null });
  },
  markPickedUp: () => {
    set((state) => ({
      currentJob: state.currentJob
        ? {
            ...state.currentJob,
            status: 'OUT_FOR_DELIVERY',
          }
        : null,
    }));
  },

  acceptNewJob: (job) => {
    set({
      currentJob: {
        ...job,
        status: 'OUT_FOR_DELIVERY',
      },
    });
  },
}));
