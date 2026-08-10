'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Tag,
  Store,
  Check,
  HeartHandshake,
  Sparkles,
  Smartphone,
  Banknote,
} from 'lucide-react';

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

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [instructions, setInstructions] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [showCustomTipInput, setShowCustomTipInput] = useState(false);

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
  const baseGrandTotal = getGrandTotal();
  const finalPayableTotal = baseGrandTotal + tipAmount;

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

      const fullInstruction = [
        instructions.trim(),
        tipAmount > 0 ? `Driver Tip included: ₹${tipAmount}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const createOrderPayload = {
        restaurantId: cartRestaurantId,
        items: itemsPayload,
        deliveryAddress: addressPayload,
        paymentMethod: validPaymentMethod,
        specialInstruction: fullInstruction || undefined,
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
          : errorData.message || 'Unable to place your order. Please try again.';
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

      // Extract numeric total amount safely
      let parsedAmount = finalPayableTotal;
      if (createdOrder.totalAmount !== undefined && createdOrder.totalAmount !== null) {
        if (typeof createdOrder.totalAmount === 'number') {
          parsedAmount = createdOrder.totalAmount + tipAmount;
        } else if (typeof createdOrder.totalAmount === 'string') {
          parsedAmount = parseFloat(createdOrder.totalAmount) + tipAmount;
        } else if (typeof createdOrder.totalAmount === 'object' && createdOrder.totalAmount.d) {
          const raw = parseFloat(String(createdOrder.totalAmount));
          parsedAmount = (!isNaN(raw) ? raw : Number(createdOrder.totalAmount.d[0])) + tipAmount;
        } else {
          parsedAmount = Number(createdOrder.totalAmount) + tipAmount;
        }
      }

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        parsedAmount = finalPayableTotal;
      }

      if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Call backend to create Razorpay payment order
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
        typeof window !== 'undefined' &&
        !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: pmtData.amount || Math.round(parsedAmount * 100),
        currency: pmtData.currency || 'INR',
        name: 'FoodHub Order',
        description: `Order #${createdOrder.orderNumber || orderId}`,
        order_id: rzpOrderId,

        ...(isDesktop && {
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'Scan & Pay',
                  instruments: [
                    {
                      method: 'upi',
                      flows: ['qr'],
                    },
                  ],
                },
              },
              sequence: ['block.upi'],
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
            setPaymentError(`Order #${createdOrder.orderNumber || orderId} created! Payment process was closed.`);
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
      setPaymentError(err.message || 'Unable to place your order. Please try again.');
    }
  };

  const handleSelectTip = (amount: number) => {
    setShowCustomTipInput(false);
    setTipAmount((prev) => (prev === amount ? 0 : amount));
  };

  const handleApplyCustomTip = () => {
    const val = parseFloat(customTip);
    if (!isNaN(val) && val > 0) {
      setTipAmount(val);
    } else {
      setTipAmount(0);
    }
    setShowCustomTipInput(false);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-xs text-gray-500">Add items from your favorite local kitchen to proceed.</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-700 transition"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  return (
    <CustomerAuthGuard>
      <div className="min-h-screen bg-gray-50/50 pb-28 sm:pb-12">
        {/* Mobile Header & Progress Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-xs">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-sm font-black text-gray-900">Secure Payment</h1>
            <div className="w-8" />
          </div>

          {/* Stepper Progress */}
          <div className="mx-auto max-w-4xl mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <span className="text-gray-500">Cart</span>
            <span>&gt;</span>
            <span className="text-gray-500">Details</span>
            <span>&gt;</span>
            <span className="font-bold text-orange-600 underline decoration-2 underline-offset-4">
              Payment
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 lg:px-8 space-y-4">
          {paymentError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-xs">
              ⚠️ {paymentError}
            </div>
          )}

          {/* Main 2-Column Responsive Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* LEFT COLUMN: Details & Payment Methods */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Delivery Address */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
                    <span>Delivery Address</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition flex items-center justify-between ${
                        selectedAddressId === addr.id
                          ? 'border-orange-500 bg-orange-50/30'
                          : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-gray-900 block truncate">{addr.label}</span>
                        <p className="text-[11px] text-gray-500 truncate">
                          {addr.addressLine1}, {addr.city}
                        </p>
                      </div>
                      <div
                        className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                          selectedAddressId === addr.id
                            ? 'border-orange-600 bg-orange-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedAddressId === addr.id && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <MessageSquare className="h-4 w-4 text-orange-600 shrink-0" />
                  <span>Delivery Instructions</span>
                </div>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Leave at gate, do not ring bell..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Tip Your Driver */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <HeartHandshake className="h-4 w-4 text-orange-600 shrink-0" />
                  <span>Tip Your Driver</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[20, 30, 50].map((amt) => {
                    const isSelected = tipAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectTip(amt)}
                        className={`rounded-xl border py-2 text-xs font-bold transition text-center ${
                          isSelected
                            ? 'border-orange-500 bg-orange-600 text-white shadow-xs'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomTipInput(!showCustomTipInput)}
                    className={`rounded-xl border py-2 text-xs font-bold transition text-center ${
                      showCustomTipInput || (tipAmount > 0 && ![20, 30, 50].includes(tipAmount))
                        ? 'border-orange-500 bg-orange-600 text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {showCustomTipInput && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      placeholder="Enter tip ₹"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTip}
                      className="rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <CreditCard className="h-4 w-4 text-orange-600 shrink-0" />
                  <span>Payment Method</span>
                </div>

                <div className="space-y-2">
                  {/* UPI */}
                  <div
                    onClick={() => setPaymentMethod('UPI')}
                    className={`cursor-pointer rounded-xl border p-3.5 transition flex items-center justify-between ${
                      paymentMethod === 'UPI'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 shrink-0">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">UPI Instant Pay</p>
                        <p className="text-[10px] text-gray-400">Google Pay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'UPI'
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'UPI' && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* CARD */}
                  <div
                    onClick={() => setPaymentMethod('CARD')}
                    className={`cursor-pointer rounded-xl border p-3.5 transition flex items-center justify-between ${
                      paymentMethod === 'CARD'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Credit / Debit Card</p>
                        <p className="text-[10px] text-gray-400">Visa, Mastercard, RuPay Cards</p>
                      </div>
                    </div>
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'CARD'
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'CARD' && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`cursor-pointer rounded-xl border p-3.5 transition flex items-center justify-between ${
                      paymentMethod === 'COD'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
                        <p className="text-[10px] text-gray-400">Pay cash upon order arrival</p>
                      </div>
                    </div>
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'COD'
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'COD' && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary Card & Coupon */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                {/* Restaurant Name */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="h-4 w-4 text-orange-600 shrink-0" />
                    <span className="text-xs font-black text-gray-900 truncate">
                      {restaurantName || 'Selected Kitchen'}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-8 w-8 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {item.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900 shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="border-t border-gray-100 pt-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-bold text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Code: {appliedCoupon.code} (-₹{appliedCoupon.discountAmount})</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[10px] font-bold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon (e.g. FOODHUB50)"
                        value={couponCodeInput}
                        onChange={(e) => {
                          setCouponCodeInput(e.target.value);
                          setCouponError(null);
                        }}
                        className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-900 uppercase focus:border-orange-500 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCodeInput.trim()}
                        className="rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1">⚠️ {couponError}</p>
                  )}
                </div>

                {/* Fee Breakdown */}
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes &amp; Fees</span>
                    <span>₹{tax + packagingFee}</span>
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
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-orange-600 font-bold">
                      <span>Driver Tip</span>
                      <span>+₹{tipAmount}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-black text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600 text-base">₹{finalPayableTotal}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating/Fixed Bottom Payment Button for Mobile & Desktop */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <span className="text-[11px] font-semibold text-gray-500 block">Total Payable</span>
              <span className="text-lg font-black text-gray-900">₹{finalPayableTotal}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 active:scale-[0.99] transition disabled:opacity-50"
            >
              <span>
                {isPlacing
                  ? 'Placing Order...'
                  : paymentMethod === 'COD'
                  ? `Place Order • ₹${finalPayableTotal}`
                  : `Place Order & Pay • ₹${finalPayableTotal}`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
