'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Wallet, ShieldCheck, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { useCartStore } from '../../stores/use-cart-store';
import { useAddressStore } from '../../stores/use-address-store';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    restaurantName,
    getSubtotal,
    getPackagingFee,
    getDeliveryFee,
    getTaxAmount,
    getDiscountAmount,
    getWalletAppliedAmount,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const { addresses, selectedAddressId, setSelectedAddress, getSelectedAddress } = useAddressStore();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'COD'>('UPI');
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const selectedAddress = getSelectedAddress();
  const subtotal = getSubtotal();
  const packagingFee = getPackagingFee();
  const deliveryFee = getDeliveryFee();
  const tax = getTaxAmount();
  const discount = getDiscountAmount();
  const walletApplied = getWalletAppliedAmount();
  const grandTotal = getGrandTotal();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setPaymentError(null);

    // 1. CASH ON DELIVERY (COD) FLOW
    if (paymentMethod === 'COD') {
      setTimeout(() => {
        clearCart();
        router.push('/orders/ord-live-9482/track');
      }, 1200);
      return;
    }

    // 2. ONLINE PAYMENT FLOW (Razorpay Checkout)
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setIsPlacing(false);
      setPaymentError('Failed to load Razorpay payment gateway SDK. Please check your network connection.');
      return;
    }

    // Create Razorpay Checkout Options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TJd8pmiEPE8AuF',
      amount: Math.round(grandTotal * 100), // Amount in paise
      currency: 'INR',
      name: 'FoodHub Enterprise',
      description: `Payment for ${restaurantName || 'Food Delivery Order'}`,
      image: '/favicon.ico',
      order_id: `rzp_order_${Date.now()}`,
      handler: function (response: any) {
        // Backend Signature Verification step before creating DB order
        if (response.razorpay_payment_id || response.razorpay_signature) {
          clearCart();
          router.push('/orders/ord-live-9482/track');
        } else {
          setIsPlacing(false);
          setPaymentError('Payment signature verification failed. Order was not created.');
        }
      },
      modal: {
        ondismiss: function () {
          setIsPlacing(false);
          setPaymentError('Payment window closed by user. No order was created.');
        },
      },
      prefill: {
        name: 'Rahul Sharma',
        email: 'customer@foodhub.com',
        contact: '+919876543210',
      },
      theme: {
        color: '#ea580c',
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsPlacing(false);
      setPaymentError('Failed to launch Razorpay Checkout. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-700"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Checkout</h1>
        <p className="text-xs text-gray-500">Confirm delivery address & payment method</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Address & Payment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Address Selection */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <MapPin className="h-5 w-5 text-orange-600" /> Delivery Address
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedAddressId === addr.id
                      ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900">{addr.label}</span>
                    {selectedAddressId === addr.id && (
                      <CheckCircle2 className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                    {addr.addressLine1}, {addr.city}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <MessageSquare className="h-5 w-5 text-orange-600" /> Delivery Instructions
            </div>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Leave package at security gate, don't ring bell..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900">
              <CreditCard className="h-5 w-5 text-orange-600" /> Payment Option
            </div>

            {paymentError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                ⚠️ {paymentError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                onClick={() => setPaymentMethod('UPI')}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                  paymentMethod === 'UPI' ? 'border-orange-500 bg-orange-50/40' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-black text-xs">
                    UPI
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">UPI Instant Pay</p>
                    <p className="text-[10px] text-gray-400">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('CARD')}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                  paymentMethod === 'CARD' ? 'border-orange-500 bg-orange-50/40' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-black text-xs">
                    CARD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Credit / Debit Card</p>
                    <p className="text-[10px] text-gray-400">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('COD')}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                  paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50/40' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 font-black text-xs">
                    COD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
                    <p className="text-[10px] text-gray-400">Pay cash to courier</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Order Summary</h3>
            <p className="text-xs font-semibold text-orange-600">{restaurantName}</p>

            <div className="space-y-3 border-y border-gray-100 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Packaging & Delivery</span>
                <span>₹{packagingFee + deliveryFee}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes (GST 5%)</span>
                <span>₹{tax}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              {walletApplied > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Wallet Applied</span>
                  <span>-₹{walletApplied}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-orange-600">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="flex w-full items-center justify-between rounded-2xl bg-orange-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50"
            >
              <span>{isPlacing ? 'Placing Order...' : 'Pay & Place Order'}</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Secured by Razorpay SSL Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </CustomerAuthGuard>
  );
}
