'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Wallet, ShieldCheck, ArrowRight, CheckCircle2, MessageSquare, Tag } from 'lucide-react';

import { useCartStore } from '../../stores/use-cart-store';
import { useAddressStore } from '../../stores/use-address-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    restaurantName,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
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
  const { user, accessToken } = useAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'COD'>('UPI');
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const selectedAddress = getSelectedAddress();
  const subtotal = getSubtotal();
  const packagingFee = getPackagingFee();
  const deliveryFee = getDeliveryFee();
  const tax = getTaxAmount();
  const discount = getDiscountAmount();
  const walletApplied = getWalletAppliedAmount();
  const grandTotal = getGrandTotal();

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = couponCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          code: cleanCode,
          subtotal,
          restaurantId: restId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.discountAmount > 0) {
          applyCoupon(cleanCode, data.discountAmount);
          setCouponError(null);
          setCouponCodeInput('');
          setIsApplyingCoupon(false);
          return;
        } else {
          setCouponError(data.message || 'Invalid or expired coupon code');
          setIsApplyingCoupon(false);
          return;
        }
      }
    } catch {
      /* Fallback to local validation */
    }

    if (cleanCode === 'FOODHUB50') {
      const disc = Math.round(subtotal * 0.5);
      applyCoupon('FOODHUB50', Math.min(disc, 150));
      setCouponError(null);
      setCouponCodeInput('');
    } else if (cleanCode === 'WELCOME100') {
      applyCoupon('WELCOME100', Math.min(100, subtotal));
      setCouponError(null);
      setCouponCodeInput('');
    } else {
      setCouponError('Invalid coupon code. Try FOODHUB50 or WELCOME100');
    }

    setIsApplyingCoupon(false);
  };


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
    if (items.length === 0) {
      setPaymentError('Your cart is empty.');
      return;
    }

    setIsPlacing(true);
    setPaymentError(null);

    try {
      // 1. Validate restaurantId
      const cartStoreRestId = useCartStore.getState().restaurantId;
      const cartRestaurantId = cartStoreRestId || items[0]?.restaurantId;

      if (!cartRestaurantId) {
        throw new Error('Restaurant information is missing from cart.');
      }

      // 2. Build backend items payload
      const itemsPayload = items.map((item) => {
        const foodId = item.foodItemId || item.id;
        return {
          foodItemId: isUUID(foodId) ? foodId : item.id,
          quantity: item.quantity,
          addonsJson: item.addons && item.addons.length > 0
            ? item.addons.map((a) => ({ addonId: a.id, name: a.name, price: a.price }))
            : undefined,
        };
      });

      // 3. Build delivery address payload
      const addressPayload = selectedAddress
        ? {
            label: selectedAddress.label,
            street: selectedAddress.addressLine1,
            city: selectedAddress.city,
            state: selectedAddress.state || 'Karnataka',
            zipCode: selectedAddress.postalCode || '560038',
            latitude: selectedAddress.latitude || 12.9716,
            longitude: selectedAddress.longitude || 77.5946,
          }
        : {
            street: '100 Ft Road, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            zipCode: '560038',
            latitude: 12.9716,
            longitude: 77.5946,
          };

      const validPaymentMethod = paymentMethod === 'COD' ? 'COD' : (paymentMethod === 'CARD' ? 'CARD' : 'UPI');

      const createOrderPayload = {
        restaurantId: cartRestaurantId,
        items: itemsPayload,
        deliveryAddress: addressPayload,
        paymentMethod: validPaymentMethod,
        specialInstruction: instructions || undefined,
        useWallet: walletApplied > 0,
      };

      // 4. Send API POST /api/v1/orders
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(createOrderPayload),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        const errMsg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || 'Failed to place order. Please verify items and try again.';
        throw new Error(errMsg);
      }

      const createdOrder = await orderRes.json();
      const orderId = createdOrder.id;

      // 5. CASH ON DELIVERY (COD) FLOW
      if (paymentMethod === 'COD') {
        clearCart();
        setIsPlacing(false);
        router.push(`/orders/${orderId}/track`);
        return;
      }

      // 6. ONLINE PAYMENT FLOW (Razorpay)
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setIsPlacing(false);
        setPaymentError(`Order #${createdOrder.orderNumber || orderId} created! Gateway SDK failed to load, opening tracking.`);
        clearCart();
        router.push(`/orders/${orderId}/track`);
        return;
      }

      // Extract numeric total amount safely (handles Prisma Decimal object, number, or string)
      let parsedAmount = grandTotal;
      if (createdOrder.totalAmount !== undefined && createdOrder.totalAmount !== null) {
        if (typeof createdOrder.totalAmount === 'number') {
          parsedAmount = createdOrder.totalAmount;
        } else if (typeof createdOrder.totalAmount === 'string') {
          parsedAmount = parseFloat(createdOrder.totalAmount);
        } else if (typeof createdOrder.totalAmount === 'object' && createdOrder.totalAmount.d) {
          parsedAmount = parseFloat(String(createdOrder.totalAmount));
          if (isNaN(parsedAmount) && Array.isArray(createdOrder.totalAmount.d)) {
            parsedAmount = Number(createdOrder.totalAmount.d[0]);
          }
        } else {
          parsedAmount = Number(createdOrder.totalAmount);
        }
      }

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        parsedAmount = grandTotal;
      }

      // Mandatory validation check
      if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Call backend to create real Razorpay payment order
      const pmtRes = await fetch(`${API_BASE}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          orderId: createdOrder.id,
          amount: Math.round(parsedAmount),
          method: validPaymentMethod,
        }),
      });

      if (!pmtRes.ok) {
        const pmtErrData = await pmtRes.json().catch(() => ({}));
        const pmtErrMsg = Array.isArray(pmtErrData.message)
          ? pmtErrData.message.join(', ')
          : pmtErrData.message || 'Failed to initialize payment gateway order.';
        throw new Error(pmtErrMsg);
      }

      const pmtData = await pmtRes.json();
      if (!pmtData.razorpayOrderId || !pmtData.razorpayOrderId.startsWith('order_')) {
        throw new Error('Invalid Razorpay order ID returned from payment server.');
      }

      const rzpOrderId = pmtData.razorpayOrderId;

    const isDesktop =
  typeof window !== "undefined" &&
  !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: pmtData.amount || Math.round(parsedAmount * 100),
  currency: pmtData.currency || "INR",
  name: "Foodtop enterprises",
  description: `Order #${createdOrder.orderNumber || orderId}`,
  order_id: rzpOrderId,

  ...(isDesktop && {
    config: {
      display: {
        blocks: {
          upi: {
            name: "Scan & Pay",
            instruments: [
              {
                method: "upi",
                flows: ["qr"],
              },
            ],
          },
        },
        sequence: ["block.upi"],
        preferences: {
          show_default_blocks: false,
        },
      },
    },
  }),

  handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json().catch(() => ({}));
              console.error('Payment verification failed:', verifyErr);
            }
          } catch (err: any) {
            console.error('Payment verification exception:', err);
          } finally {
            clearCart();
            setIsPlacing(false);
            router.push(`/orders/${orderId}/track`);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPlacing(false);
            setPaymentError(`Order #${createdOrder.orderNumber || orderId} created! Payment cancelled by user. You can retry payment from order tracking.`);
          },
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#ea580c',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setIsPlacing(false);
      setPaymentError(err.message || 'An error occurred while placing order.');
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

          {/* Right Column: Order Summary & Coupon */}
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

              {/* Coupon Section */}
              <div className="rounded-2xl bg-orange-50/50 p-4 border border-orange-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                    <Tag className="h-4 w-4 text-orange-600" /> Apply Promo Code
                  </div>
                  {appliedCoupon && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                      Applied
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-black text-gray-900">{appliedCoupon.code}</span>
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          Saving ₹{appliedCoupon.discountAmount} on this order
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Try FOODHUB50"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value);
                        setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      disabled={isApplyingCoupon}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-900 uppercase focus:border-orange-500 focus:outline-none disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCodeInput.trim()}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition shrink-0"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-xs font-bold text-rose-700">
                    ⚠️ {couponError}
                  </div>
                )}
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
