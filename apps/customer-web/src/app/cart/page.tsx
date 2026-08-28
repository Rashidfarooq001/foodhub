'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  CheckCircle2,
  ArrowRight,
  Store,
} from 'lucide-react';
import { useCartStore } from '../../stores/use-cart-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    restaurantName,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getDeliveryFee,
    getTaxAmount,
    getGrandTotal,
    orderQuote,
    fetchCartQuote,
  } = useCartStore();

  const subtotal = getSubtotal();
  
  useEffect(() => {
    if (items.length > 0) {
      fetchCartQuote().catch(console.error);
    }
  }, [items.length, fetchCartQuote]);

  const platformFee = orderQuote?.platformFee ?? 5;
  const tax = orderQuote?.totalCustomerTaxes ?? 0;
  const deliveryFee = orderQuote?.customerDeliveryFee ?? 15;
  const grandTotal = orderQuote?.customerTotal ?? getGrandTotal();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-xs text-gray-500">Good food is always waiting for you. Discover top kitchens nearby!</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-700 transition"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  return (
    <CustomerAuthGuard>
      <div className="bg-gray-50/50 pb-8">
        {/* Header & Stepper */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-xs">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-sm font-black text-gray-900">Your Cart</h1>
            <div className="w-8" />
          </div>

          {/* Stepper Progress: Cart > Payment */}
          <div className="mx-auto max-w-4xl mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <span className="font-bold text-orange-600 underline decoration-2 underline-offset-4">
              Cart
            </span>
            <span>&gt;</span>
            <span className="text-gray-400">Payment</span>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-4 space-y-4">
          {/* Restaurant Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Store className="h-5 w-5 text-orange-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{restaurantName || 'Kitchen'}</p>
                <p className="text-[10px] text-gray-400">{items.length} items in cart</p>
              </div>
            </div>
            <button
              onClick={clearCart}
              className="text-xs font-bold text-rose-600 hover:underline shrink-0"
            >
              Clear Cart
            </button>
          </div>

          {/* Items List */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">Order Items</h3>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[11px] font-bold text-orange-600">
                          Variant: {item.variantName}
                        </p>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-[10px] text-gray-400 truncate">
                          + {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p className="text-xs font-black text-gray-900 mt-0.5">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center rounded-xl bg-gray-100 text-gray-800">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded-l-xl"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded-r-xl"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Bill Summary */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Bill Summary</h3>
            <div className="flex justify-between text-gray-600">
              <span>Item Subtotal</span>
              <span>&#x20B9;{subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>&#x20B9;{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform Fee</span>
                <span>&#x20B9;{platformFee}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST &amp; Taxes</span>
                <span>&#x20B9;{tax}</span>
            </div>

            <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-black text-gray-900">
              <span>To Pay</span>
              <span className="text-orange-600 text-base">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Proceed Button */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
          <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block">Total</span>
              <span className="text-lg font-black text-gray-900">₹{grandTotal}</span>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 active:scale-[0.99] transition"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
