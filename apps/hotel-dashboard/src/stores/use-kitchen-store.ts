'use client';

import { create } from 'zustand';
import { KitchenOrderItem } from '../data/hotel-mock-data';

interface KitchenState {
  queue: KitchenOrderItem[];
  setQueue: (data: KitchenOrderItem[]) => void;
  acceptOrder: (id: string) => void;
  markPreparing: (id: string) => void;
  markReady: (id: string) => void;
  cancelOrder: (id: string) => void;
}

export const useKitchenStore = create<KitchenState>()((set) => ({
  // Data starts empty — pages fetch from backend and call setQueue
  queue: [],

  setQueue: (data) => set({ queue: data }),

  acceptOrder: (id) =>
    set((state) => ({
      queue: state.queue.map((q) => (q.id === id ? { ...q, status: 'PREPARING' } : q)),
    })),

  markPreparing: (id) =>
    set((state) => ({
      queue: state.queue.map((q) => (q.id === id ? { ...q, status: 'PREPARING' } : q)),
    })),

  markReady: (id) =>
    set((state) => ({
      queue: state.queue.map((q) => (q.id === id ? { ...q, status: 'READY_FOR_PICKUP' } : q)),
    })),

  cancelOrder: (id) =>
    set((state) => ({
      queue: state.queue.map((q) => (q.id === id ? { ...q, status: 'CANCELLED' } : q)),
    })),
}));
