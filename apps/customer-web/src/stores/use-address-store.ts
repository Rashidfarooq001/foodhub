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
  latitude?: number | null;
  longitude?: number | null;
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
          const rawId = (newAddr as any).id;
          const isCurrentLoc = rawId === 'current-location' || newAddr.label === 'Current Location';
          const id = isCurrentLoc ? 'current-location' : (rawId || `addr-${Date.now()}`);
          const item: CustomerAddressItem = { ...newAddr, id, label: isCurrentLoc ? 'Current Location' : newAddr.label };

          // Filter out existing address with same ID or same Current Location label to prevent duplicates
          const filtered = state.addresses.filter(
            (a) => a.id !== id && !(isCurrentLoc && a.label === 'Current Location'),
          );

          return {
            addresses: [...filtered, item],
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
