'use client';

import { create } from 'zustand';
import {
  PendingRestaurantApproval,
  PendingDriverApproval,
} from '../data/admin-mock-data';

interface AdminState {
  pendingRestaurants: PendingRestaurantApproval[];
  pendingDrivers: PendingDriverApproval[];
  isMaintenanceMode: boolean;
  platformCommissionRate: number;
  setPendingRestaurants: (data: PendingRestaurantApproval[]) => void;
  setPendingDrivers: (data: PendingDriverApproval[]) => void;
  approveRestaurant: (id: string) => void;
  rejectRestaurant: (id: string) => void;
  approveDriver: (id: string) => void;
  rejectDriver: (id: string) => void;
  toggleMaintenanceMode: () => void;
  setCommissionRate: (rate: number) => void;
}

export const useAdminStore = create<AdminState>()((set) => ({
  // Data starts empty — pages fetch from backend and call setPending* actions
  pendingRestaurants: [],
  pendingDrivers: [],
  isMaintenanceMode: false,
  platformCommissionRate: 18.0,

  setPendingRestaurants: (data) => set({ pendingRestaurants: data }),

  setPendingDrivers: (data) => set({ pendingDrivers: data }),

  approveRestaurant: (id) =>
    set((state) => ({
      pendingRestaurants: state.pendingRestaurants.map((r) =>
        r.id === id ? { ...r, status: 'APPROVED' } : r,
      ),
    })),

  rejectRestaurant: (id) =>
    set((state) => ({
      pendingRestaurants: state.pendingRestaurants.map((r) =>
        r.id === id ? { ...r, status: 'REJECTED' } : r,
      ),
    })),

  approveDriver: (id) =>
    set((state) => ({
      pendingDrivers: state.pendingDrivers.map((d) =>
        d.id === id ? { ...d, status: 'APPROVED' } : d,
      ),
    })),

  rejectDriver: (id) =>
    set((state) => ({
      pendingDrivers: state.pendingDrivers.map((d) =>
        d.id === id ? { ...d, status: 'REJECTED' } : d,
      ),
    })),

  toggleMaintenanceMode: () =>
    set((state) => ({ isMaintenanceMode: !state.isMaintenanceMode })),

  setCommissionRate: (rate) => set({ platformCommissionRate: rate }),
}));
