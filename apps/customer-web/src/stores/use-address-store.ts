'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CustomerAddressItem {
  id: string;
  label: string; // Home, Work, Other, Current Location
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

interface AddressState {
  addresses: CustomerAddressItem[];
  selectedAddressId: string | null;
  setAddresses: (addresses: CustomerAddressItem[]) => void;
  addAddress: (address: Omit<CustomerAddressItem, 'id'> | CustomerAddressItem) => void;
  removeAddress: (id: string) => void;
  setSelectedAddress: (id: string) => void;
  getSelectedAddress: () => CustomerAddressItem | null;
  clearAddresses: () => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,

      setAddresses: (addresses) =>
        set({
          addresses,
          selectedAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null,
        }),

      addAddress: (newAddr) =>
        set((state) => {
          const id = (newAddr as any).id || `addr-${Date.now()}`;
          const item = { ...newAddr, id };
          return {
            addresses: [...state.addresses.filter((a) => a.id !== id), item],
            selectedAddressId: id,
          };
        }),

      removeAddress: (id) =>
        set((state) => {
          const updated = state.addresses.filter((a) => a.id !== id);
          return {
            addresses: updated,
            selectedAddressId: state.selectedAddressId === id ? (updated[0]?.id || null) : state.selectedAddressId,
          };
        }),

      setSelectedAddress: (id) => set({ selectedAddressId: id }),

      getSelectedAddress: () => {
        const { addresses, selectedAddressId } = get();
        if (!selectedAddressId) return addresses[0] || null;
        return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
      },

      clearAddresses: () => set({ addresses: [], selectedAddressId: null }),
    }),
    {
      name: 'foodhub-customer-addresses',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
