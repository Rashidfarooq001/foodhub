'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CustomerOrderQuoteData, fetchOrderQuote } from '@foodhub/api-client';
import { CustomerAddressItem } from './use-address-store';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item key (foodId + variantId + addonIds)
  foodItemId: string;
  variantId?: string;
  name: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  quantity: number;
  variantName?: string;
  addons: CartAddon[];
  restaurantId: string;
  restaurantName: string;
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  appliedCoupon: AppliedCoupon | null;
  orderQuote: CustomerOrderQuoteData | null;

  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setOrderQuote: (quote: CustomerOrderQuoteData | null) => void;
  fetchCartQuote: (address?: CustomerAddressItem | null) => Promise<CustomerOrderQuoteData | null>;

  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      appliedCoupon: null,
      orderQuote: null,

      addItem: (newItem) => {
        const { items, restaurantId } = get();

        // If ordering from a different restaurant, clear previous cart items
        if (restaurantId && restaurantId !== newItem.restaurantId) {
          set({
            items: [],
            restaurantId: newItem.restaurantId,
            restaurantName: newItem.restaurantName,
            appliedCoupon: null,
            orderQuote: null,
          });
        }

        const addonKey = newItem.addons.map((a) => a.id).sort().join('-');
        const variantKey = newItem.variantId || newItem.variantName || 'default';
        const itemKey = `${newItem.foodItemId}-${variantKey}-${addonKey}`;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.id === itemKey);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += 1;
          set({ items: updated, orderQuote: null });
        } else {
          set({
            items: [
              ...currentItems,
              { ...newItem, id: itemKey, quantity: 1 },
            ],
            restaurantId: newItem.restaurantId,
            restaurantName: newItem.restaurantName,
            orderQuote: null,
          });
        }
      },

      removeItem: (id) =>
        set((state) => {
          const updated = state.items.filter((i) => i.id !== id);
          return {
            items: updated,
            restaurantId: updated.length === 0 ? null : state.restaurantId,
            restaurantName: updated.length === 0 ? null : state.restaurantName,
            orderQuote: null,
          };
        }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          orderQuote: null,
        }));
      },

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          appliedCoupon: null,
          orderQuote: null,
        }),

      applyCoupon: (code, discountAmount) => set({ appliedCoupon: { code, discountAmount }, orderQuote: null }),

      removeCoupon: () => set({ appliedCoupon: null, orderQuote: null }),

      setOrderQuote: (quote) => set({ orderQuote: quote }),

      fetchCartQuote: async (address?: CustomerAddressItem | null) => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) {
          set({ orderQuote: null });
          return null;
        }

        const restaurantId = get().restaurantId || get().items[0]?.restaurantId || undefined;
        const discountAmount = get().getDiscountAmount();

        const hasCoords = address?.latitude !== null && address?.latitude !== undefined &&
          address?.longitude !== null && address?.longitude !== undefined;

        const locationSource = (address as any)?.locationSource || (address?.id === 'current-location' ? 'CURRENT_GPS' : 'PLACE_SEARCH');

        const quote = await fetchOrderQuote({
          foodSubtotal: subtotal,
          restaurantId,
          latitude: hasCoords ? address!.latitude! : undefined,
          longitude: hasCoords ? address!.longitude! : undefined,
          locationSource,
          discountAmount,
        });

        if (quote) {
          set({ orderQuote: quote });
        }
        return quote;
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
          return total + (item.price + addonsTotal) * item.quantity;
        }, 0);
      },

      getDeliveryFee: () => {
        const { orderQuote } = get();
        if (orderQuote) return orderQuote.customerDeliveryFee;
        return 15; // Fixed business delivery fee ₹15
      },

      getTaxAmount: () => {
        const { orderQuote } = get();
        if (orderQuote) return orderQuote.totalCustomerTaxes;
        return 0; // GST = ₹0
      },

      getDiscountAmount: () => (get().appliedCoupon ? get().appliedCoupon!.discountAmount : 0),

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;

        const { orderQuote } = get();
        if (orderQuote) return orderQuote.customerTotal;

        const total =
          subtotal +
          get().getDeliveryFee() +
          3 - // Fixed Platform Fee ₹3
          get().getDiscountAmount();
        return Math.max(0, total);
      },

      getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'foodhub-cart-storage-v3',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          return { items: [], restaurantId: null, restaurantName: null, appliedCoupon: null, orderQuote: null };
        }
        return persistedState as CartState;
      },
    },
  ),
);
