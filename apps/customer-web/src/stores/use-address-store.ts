'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CustomerAddressItem {
  id: string;
  label: string; // Home, Work, Other, Current Location, Place Search
  placeName?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?:
    'CURRENT_GPS' | 'PLACE_SEARCH' | 'SAVED_ADDRESS' | 'MANUAL_ADDRESS' | 'MANUAL_GEOCODED';
  verificationStatus?: 'VERIFIED' | 'FAILED' | 'UNVERIFIED';
  accuracyMeters?: number | null;
  isDefault: boolean;
}

interface AddressState {
  addresses: CustomerAddressItem[];
  selectedAddressId: string | null; // Used as CURRENT LOCATION
  deliveryAddressId: string | null; // Used strictly for CHECKOUT DELIVERY DESTINATION

  setAddresses: (addresses: CustomerAddressItem[]) => void;
  addAddress: (address: Omit<CustomerAddressItem, 'id'> | CustomerAddressItem, setAsDelivery?: boolean) => void;
  removeAddress: (id: string) => void;
  
  setSelectedAddress: (id: string) => void;
  getSelectedAddress: () => CustomerAddressItem | null;
  
  setDeliveryAddress: (id: string) => void;
  getDeliveryAddress: () => CustomerAddressItem | null;

  clearAddresses: () => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,
      deliveryAddressId: null,

      setAddresses: (addresses) =>
        set({
          addresses,
          selectedAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null,
          deliveryAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null,
        }),

      addAddress: (newAddr, setAsDelivery = false) =>
        set((state) => {
          const rawId = (newAddr as any).id;
          const isCurrentLoc = rawId === 'current-location' || newAddr.label === 'Current Location';
          const id = isCurrentLoc ? 'current-location' : rawId || 'addr-' + Date.now();
          const item: CustomerAddressItem = {
            ...newAddr,
            id,
            label: isCurrentLoc ? 'Current Location' : newAddr.label,
            locationSource:
              newAddr.locationSource || (isCurrentLoc ? 'CURRENT_GPS' : 'PLACE_SEARCH'),
            verificationStatus: newAddr.verificationStatus || 'VERIFIED',
          };

          const filtered = state.addresses.filter(
            (a) => a.id !== id && !(isCurrentLoc && a.label === 'Current Location'),
          );

          return {
            addresses: [...filtered, item],
            ...(setAsDelivery ? { deliveryAddressId: id } : { selectedAddressId: id }),
          };
        }),

      removeAddress: (id) =>
        set((state) => {
          const updated = state.addresses.filter((a) => a.id !== id);
          return {
            addresses: updated,
            selectedAddressId:
              state.selectedAddressId === id ? updated[0]?.id || null : state.selectedAddressId,
            deliveryAddressId:
              state.deliveryAddressId === id ? updated[0]?.id || null : state.deliveryAddressId,
          };
        }),

      setSelectedAddress: (id) => set({ selectedAddressId: id }),

      getSelectedAddress: () => {
        const { addresses, selectedAddressId } = get();
        if (!selectedAddressId) return addresses[0] || null;
        return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
      },

      setDeliveryAddress: (id) => set({ deliveryAddressId: id }),

      getDeliveryAddress: () => {
        const { addresses, deliveryAddressId } = get();
        if (deliveryAddressId) {
          const found = addresses.find((a) => a.id === deliveryAddressId);
          if (found) return found;
        }
        
        // Find a default saved delivery address, excluding current-location
        const savedAddresses = addresses.filter(a => a.id !== 'current-location' && a.label !== 'Current Location');
        if (savedAddresses.length > 0) {
          return savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        }
        return null;
      },

      clearAddresses: () => set({ addresses: [], selectedAddressId: null, deliveryAddressId: null }),
    }),
    {
      name: 'foodhub-customer-addresses-v6',
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persistedState: any, version: number) => {
        if (version < 6) {
          const s = persistedState as any;
          return { 
            addresses: s?.addresses || [], 
            selectedAddressId: s?.selectedAddressId || null,
            deliveryAddressId: s?.selectedAddressId || null 
          };
        }
        return persistedState as AddressState;
      },
    },
  ),
);



