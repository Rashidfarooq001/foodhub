'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CustomerAddressItem {
  id: string;
  label: string; // Home, Work, Other
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
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [
        {
          id: 'addr-1',
          label: 'Home',
          addressLine1: 'Flat 402, Green Valley Apartments',
          addressLine2: 'Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          latitude: 12.9716,
          longitude: 77.5946,
          isDefault: true,
        },
        {
          id: 'addr-2',
          label: 'Work',
          addressLine1: 'Tech Park Tower B, 5th Floor',
          addressLine2: 'Outer Ring Road, Marathahalli',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
          latitude: 12.9352,
          longitude: 77.6946,
          isDefault: false,
        },
      ],
      selectedAddressId: 'addr-1',

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
            selectedAddressId: state.selectedAddressId || id,
          };
        }),

      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
          selectedAddressId: state.selectedAddressId === id ? null : state.selectedAddressId,
        })),

      setSelectedAddress: (id) => set({ selectedAddressId: id }),

      getSelectedAddress: () => {
        const { addresses, selectedAddressId } = get();
        return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
      },
    }),
    {
      name: 'foodhub-customer-addresses',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
