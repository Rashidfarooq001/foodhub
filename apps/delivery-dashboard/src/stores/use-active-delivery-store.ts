'use client';

import { create } from 'zustand';
import { DeliveryJob } from '../data/delivery-mock-data';

interface ActiveDeliveryState {
  currentJob: DeliveryJob | null;
  setCurrentJob: (job: DeliveryJob | null) => void;
  verifyOtpAndComplete: (otp: string) => boolean;
  markPickedUp: () => void;
  acceptNewJob: (job: DeliveryJob) => void;
}

export const useActiveDeliveryStore = create<ActiveDeliveryState>()((set, get) => ({
  // Starts empty — pages fetch from backend
  currentJob: null,

  setCurrentJob: (job) => set({ currentJob: job }),

  verifyOtpAndComplete: (otp) => {
    const job = get().currentJob;
    if (job && job.deliveryOtp === otp) {
      set({ currentJob: null });
      return true;
    }
    return false;
  },

  markPickedUp: () => {
    set((state) => ({
      currentJob: state.currentJob ? { ...state.currentJob, status: 'PICKED_UP' } : null,
    }));
  },

  acceptNewJob: (job) => {
    set({ currentJob: { ...job, status: 'ASSIGNED' } });
  },
}));
