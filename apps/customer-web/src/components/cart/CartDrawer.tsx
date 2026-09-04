'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Trash2,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useCartStore } from '../../stores/use-cart-store';
import { useAddressStore } from '../../stores/use-address-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { CouponData } from '../../data/mock-data';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const {
    items,
    restaurantName,
    orderQuote,
    updateQuantity,
    removeItem,
    getSubtotal,
    fetchCartQuote,
  } = useCartStore();

  const { getSelectedAddress } = useAddressStore();
  const selectedAddress = getSelectedAddress();

  // Fetch backend quote whenever items or selected location changes
  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetchCartQuote(selectedAddress);
    }
  }, [isOpen, items, selectedAddress]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();

  const hasVerifiedLocation =
    selectedAddress &&
    selectedAddress.latitude !== null &&
    selectedAddress.latitude !== undefined &&
    selectedAddress.longitude !== null &&
    selectedAddress.longitude !== undefined;

  const deliveryFeeText =
    hasVerifiedLocation && orderQuote
      ? `₹${orderQuote.customerDeliveryFee}`
      : 'Calculated at checkout';

  const taxText = orderQuote
    ? `₹${orderQuote.totalCustomerTaxes}`
    : `₹${Math.round(subtotal * 0.05)}`;

  const payableTotal = orderQuote ? orderQuote.customerTotal : subtotal + 15 + 3;

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end items-end md:items-stretch">
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col rounded-t-[20px] md:rounded-none max-h-[90dvh] md:max-h-[100dvh] transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Your Cart</h3>
              <p className="text-xs text-gray-500">{restaurantName || 'Empty Cart'}</p>
            </div>
          </div>
          <button aria-label="Close cart" onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Location Bar Indicator */}
        {selectedAddress && (
          <div className="bg-orange-50/70 border-b border-orange-100 px-4 py-2 flex items-center justify-between text-xs font-semibold text-orange-950">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
              <span className="truncate">
                {selectedAddress.addressLine1}, {selectedAddress.city}
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              className="text-[10px] font-bold text-orange-600 hover:underline shrink-0 ml-2 uppercase tracking-wide"
            >
              Change
            </button>
          </div>
        )}

        {/* Cart Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Your cart is empty</h4>
              <p className="max-w-xs text-[11px] text-gray-500">
                Good food is always waiting for you. Discover top restaurants nearby!
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 rounded-full border ${
                          item.isVeg
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-rose-600 bg-rose-600'
                        }`}
                      />
                      <div>
                        <h5 className="text-sm font-bold text-gray-900">{item.name}</h5>
                        {item.addons.length > 0 && (
                          <p className="text-[10px] text-gray-400">
                            Addons: {item.addons.map((a) => a.name).join(', ')}
                          </p>
                        )}
                        <p className="text-xs font-black text-gray-900 mt-1">₹{item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-xl bg-gray-100 text-gray-800">
                        <button aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded-l-xl"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded-r-xl"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button aria-label="Remove item" onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="space-y-2 border-t border-gray-100 pt-4 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Item Subtotal</span>
                  <span className="font-bold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span
                    className={
                      hasVerifiedLocation && orderQuote
                        ? 'font-bold text-gray-900'
                        : 'italic text-gray-500'
                    }
                  >
                    {deliveryFeeText}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes &amp; Levies</span>
                  <span>{taxText}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-black text-gray-900">
                  <span>To Pay</span>
                  <span className="text-orange-600">₹{payableTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Trigger */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-white mt-auto rounded-b-[20px] md:rounded-none">
            <button
              onClick={handleCheckout}
              className="flex w-full items-center justify-between rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 transition shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <span className="flex items-center gap-1.5">
                ₹{payableTotal} <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
