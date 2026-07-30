'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item key (foodId + variantId + addonIds)
  foodItemId: string;
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

export type PackagingFeeType = 'NONE' | 'FLAT' | 'PER_ITEM';

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  packagingFeeType: PackagingFeeType;
  packagingFeeRate: number;
  appliedCoupon: AppliedCoupon | null;
  useWalletBalance: boolean;
  walletBalance: number;

  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setPackagingRule: (type: PackagingFeeType, rate: number) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  toggleWallet: () => void;

  getSubtotal: () => number;
  getPackagingFee: () => number;
  getDeliveryFee: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  getWalletAppliedAmount: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      packagingFeeType: 'FLAT',
      packagingFeeRate: 15,
      appliedCoupon: null,
      useWalletBalance: false,
      walletBalance: 250,

      addItem: (newItem) => {
        const { items, restaurantId } = get();

        // If ordering from a different restaurant, clear previous cart items
        if (restaurantId && restaurantId !== newItem.restaurantId) {
          set({
            items: [],
            restaurantId: newItem.restaurantId,
            restaurantName: newItem.restaurantName,
            appliedCoupon: null,
          });
        }

        const addonKey = newItem.addons.map((a) => a.id).sort().join('-');
        const itemKey = `${newItem.foodItemId}-${newItem.variantName || 'default'}-${addonKey}`;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.id === itemKey);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += 1;
          set({ items: updated });
        } else {
          set({
            items: [
              ...currentItems,
              { ...newItem, id: itemKey, quantity: 1 },
            ],
            restaurantId: newItem.restaurantId,
            restaurantName: newItem.restaurantName,
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
          };
        }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          appliedCoupon: null,
        }),

      setPackagingRule: (type, rate) => set({ packagingFeeType: type, packagingFeeRate: rate }),

      applyCoupon: (code, discountAmount) => set({ appliedCoupon: { code, discountAmount } }),

      removeCoupon: () => set({ appliedCoupon: null }),

      toggleWallet: () => set((state) => ({ useWalletBalance: !state.useWalletBalance })),

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
          return total + (item.price + addonsTotal) * item.quantity;
        }, 0);
      },

      getPackagingFee: () => {
        const itemCount = get().getItemCount();
        if (itemCount === 0) return 0;
        const { packagingFeeType, packagingFeeRate } = get();
        if (packagingFeeType === 'NONE') return 0;
        if (packagingFeeType === 'PER_ITEM') return packagingFeeRate * itemCount;
        return packagingFeeRate; // FLAT
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        if (subtotal >= 500) return 0; // Free delivery for orders >= 500
        return 35; // Standard dynamic delivery fee
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * 0.05); // 5% GST
      },

      getDiscountAmount: () => (get().appliedCoupon ? get().appliedCoupon!.discountAmount : 0),

      getWalletAppliedAmount: () => {
        const { useWalletBalance, walletBalance } = get();
        if (!useWalletBalance) return 0;
        const totalBeforeWallet =
          get().getSubtotal() +
          get().getPackagingFee() +
          get().getDeliveryFee() +
          get().getTaxAmount() -
          get().getDiscountAmount();
        return Math.min(walletBalance, Math.max(0, totalBeforeWallet));
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const total =
          subtotal +
          get().getPackagingFee() +
          get().getDeliveryFee() +
          get().getTaxAmount() -
          get().getDiscountAmount() -
          get().getWalletAppliedAmount();
        return Math.max(0, total);
      },

      getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'foodhub-customer-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
