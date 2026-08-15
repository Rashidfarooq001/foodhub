'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Tag,
  Store,
  Check,
  HeartHandshake,
  Smartphone,
  Banknote,
  Navigation,
  Plus,
  Compass,
  AlertTriangle,
  X,
} from 'lucide-react';

import { useCartStore } from '../../stores/use-cart-store';
import { useAddressStore, CustomerAddressItem } from '../../stores/use-address-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { getApiBaseUrl } from '@foodhub/config';
import AddressSearchBar from '@/components/AddressSearchBar';

const API_BASE = getApiBaseUrl();

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

// Haversine Distance Helper (in Kilometers)
function calculateHaversineDistance(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
): number | null {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
    (lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)
  ) {
    return null;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

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
    getTaxAmount,
    getDiscountAmount,
    getWalletAppliedAmount,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const { addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress } =
    useAddressStore();
  const { user, accessToken } = useAuthStore();

  // Restaurant details state (real coordinates & radius)
  const [restaurantData, setRestaurantData] = useState<{
    latitude: number | null;
    longitude: number | null;
    deliveryRadius: number;
  } | null>(null);

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

  // Custom Address Modal Form state
  const [showCustomAddressModal, setShowCustomAddressModal] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);

  const [newAddrLabel, setNewAddrLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newHouseNo, setNewHouseNo] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);

  const selectedAddress = getSelectedAddress();

  // Fetch real restaurant coordinates from backend API
  useEffect(() => {
    const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
    if (!restId) return;

    const fetchRestaurantDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/${restId}`);
        if (res.ok) {
          const data = await res.json();
          const lat = typeof data.latitude === 'number' ? data.latitude : parseFloat(data.latitude);
          const lng = typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude);

          setRestaurantData({
            latitude: !isNaN(lat) && lat !== 0 ? lat : null,
            longitude: !isNaN(lng) && lng !== 0 ? lng : null,
            deliveryRadius: data.deliveryRadius ? Number(data.deliveryRadius) : 15.0,
          });
        }
      } catch {
        /* offline */
      }
    };
    fetchRestaurantDetails();
  }, [items]);

  // Calculate real customer <-> restaurant distance
  const realDistanceKm = calculateHaversineDistance(
    selectedAddress?.latitude,
    selectedAddress?.longitude,
    restaurantData?.latitude,
    restaurantData?.longitude,
  );

  // Determine delivery fee dynamically based on real distance
  const dynamicDeliveryFee =
    realDistanceKm !== null
      ? realDistanceKm <= 3.0
        ? 25
        : realDistanceKm <= 7.0
        ? 35
        : 50
      : 35;

  const maxRadiusKm = restaurantData?.deliveryRadius ?? 15.0;
  const isDeliveryEligible =
    realDistanceKm === null || realDistanceKm <= maxRadiusKm;

  const subtotal = getSubtotal();
  const packagingFee = getPackagingFee();
  const tax = getTaxAmount();
  const discount = getDiscountAmount();
  const walletApplied = getWalletAppliedAmount();
  const baseGrandTotal =
    subtotal + packagingFee + dynamicDeliveryFee + tax - discount - walletApplied;
  const finalPayableTotal = Math.max(0, baseGrandTotal) + tipAmount;

  // Real-Time Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg('Geolocation is not supported by your browser device.');
      return;
    }

    setIsLocatingUser(true);
    setLocationStatusMsg('Acquiring real-time GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setNewLat(lat);
        setNewLng(lng);

        // Reverse geocoding via OpenStreetMap Nominatim API
        let reverseCity = '';
        let reverseState = '';
        let reversePin = '';
        let reverseArea = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        try {
          const geoRes = await fetch(
            `${API_BASE}/geolocation/reverse-geocode?lat=${lat}&lng=${lng}`,
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (typeof geoData === 'string') {
              reverseArea = geoData;
            } else if (geoData.address || geoData.displayName) {
              reverseArea = geoData.address || geoData.displayName;
            }
          }
        } catch {
          /* reverse geocode fallback */
        }

        const newCreatedAddr: CustomerAddressItem = {
          id: 'current-location',
          label: 'Current Location',
          addressLine1: reverseArea,
          addressLine2: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: reverseCity || 'Local Area',
          state: reverseState,
          postalCode: reversePin,
          latitude: lat,
          longitude: lng,
          isDefault: true,
        };

        addAddress(newCreatedAddr);
        setSelectedAddress('current-location');
        setIsLocatingUser(false);
        setLocationStatusMsg(null);
      },
      (err) => {
        setIsLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatusMsg(
            'Location permission denied. Please enter a custom delivery address below.',
          );
          setShowCustomAddressModal(true);
        } else {
          setLocationStatusMsg('Unable to retrieve device position. Please enter address manually.');
          setShowCustomAddressModal(true);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Save Custom Address Handler
  const handleSaveCustomAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.trim() || newLat === null || newLng === null || isNaN(newLat) || isNaN(newLng) || (newLat === 0 && newLng === 0)) {
      setLocationStatusMsg('Please search and select a delivery address.');
      return;
    }

    const createdAddr: CustomerAddressItem = {
      id: `addr-custom-${Date.now()}`,
      label: newAddrLabel,
      addressLine1: newArea.trim(),
      addressLine2: newLandmark.trim() || '',
      landmark: newLandmark.trim() || undefined,
      city: newCity.trim() || '',
      state: newState.trim() || '',
      postalCode: newPinCode.trim() || '',
      latitude: newLat,
      longitude: newLng,
      isDefault: false,
    };

    addAddress(createdAddr);
    setSelectedAddress(createdAddr.id);
    setShowCustomAddressModal(false);
    setLocationStatusMsg(null);
    // reset form
    setNewHouseNo('');
    setNewArea('');
    setNewLandmark('');
    setNewCity('');
    setNewState('');
    setNewPinCode('');
    setNewLat(null);
    setNewLng(null);
  };

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

    if (!selectedAddress) {
      setPaymentError('Please select or add a delivery address.');
      return;
    }

    if (!isDeliveryEligible && realDistanceKm !== null) {
      setPaymentError(
        `Selected address is ${realDistanceKm} km away, which exceeds the store delivery radius of ${maxRadiusKm} km.`,
      );
      return;
    }

    setIsPlacing(true);
    setPaymentError(null);

    try {
      const cartStoreRestId = useCartStore.getState().restaurantId;
      const cartRestaurantId = cartStoreRestId || items[0]?.restaurantId;

      if (!cartRestaurantId) {
        throw new Error('Restaurant information is missing from cart.');
      }

      const itemsPayload = items.map((item) => {
        const foodId = item.foodItemId || item.id;
        return {
          foodItemId: isUUID(foodId) ? foodId : item.id,
          quantity: item.quantity,
          addonsJson:
            item.addons && item.addons.length > 0
              ? item.addons.map((a) => ({ addonId: a.id, name: a.name, price: a.price }))
              : undefined,
        };
      });

      // Pass selected customer address with exact real coordinates
      const addressPayload = {
        label: selectedAddress.label,
        street: selectedAddress.addressLine1,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2 || '',
        landmark: selectedAddress.landmark || '',
        city: selectedAddress.city,
        state: selectedAddress.state || '',
        postalCode: selectedAddress.postalCode || '',
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      };

      const validPaymentMethod =
        paymentMethod === 'COD' ? 'COD' : paymentMethod === 'CARD' ? 'CARD' : 'UPI';

      const fullInstruction = [
        instructions.trim(),
        tipAmount > 0 ? `Driver Tip: ₹${tipAmount}` : '',
        realDistanceKm !== null ? `Distance: ${realDistanceKm} km` : '',
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

      // CASH ON DELIVERY (COD) FLOW
      if (paymentMethod === 'COD') {
        clearCart();
        setIsPlacing(false);
        router.push(`/orders/${orderId}/track`);
        return;
      }

      // ONLINE PAYMENT FLOW (Razorpay)
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setIsPlacing(false);
        clearCart();
        router.push(`/orders/${orderId}/track`);
        return;
      }

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
                  instruments: [{ method: 'upi', flows: ['qr'] }],
                },
              },
              sequence: ['block.upi'],
              preferences: { show_default_blocks: false },
            },
          },
        }),

        handler: async function (response: any) {
          try {
            await fetch(`${API_BASE}/payments/verify`, {
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
          } catch {
            /* ignore */
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
        theme: { color: '#ea580c' },
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
              onClick={() => router.push('/cart')}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-sm font-black text-gray-900">Secure Payment</h1>
            <div className="w-8" />
          </div>

          {/* Stepper Progress: Cart > Payment */}
          <div className="mx-auto max-w-4xl mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <Link
              href="/cart"
              className="text-gray-500 hover:text-gray-900 transition hover:underline"
            >
              Cart
            </Link>
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

          {locationStatusMsg && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-800">
              ℹ️ {locationStatusMsg}
            </div>
          )}

          {/* Main 2-Column Responsive Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT COLUMN: Delivery Location & Options */}
            <div className="lg:col-span-7 space-y-4">
              {/* Delivery Address Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
                    <span>Delivery Address</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocatingUser}
                      className="flex items-center gap-1 rounded-xl bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 hover:bg-orange-100 transition disabled:opacity-50"
                    >
                      <Navigation className={`h-3 w-3 ${isLocatingUser ? 'animate-spin' : ''}`} />
                      <span>{isLocatingUser ? 'Locating...' : 'Use Current Location'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomAddressModal(true)}
                      className="flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-200 transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Custom Address</span>
                    </button>
                  </div>
                </div>

                {/* Address Selection / Empty State */}
                {addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center space-y-2">
                    <p className="text-xs font-bold text-gray-700">No saved addresses</p>
                    <p className="text-[11px] text-gray-400">
                      Use your real current location or enter a custom delivery address to proceed.
                    </p>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocatingUser}
                        className="rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition"
                      >
                        Use Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomAddressModal(true)}
                        className="rounded-xl bg-gray-200 px-3.5 py-2 text-xs font-bold text-gray-800 hover:bg-gray-300 transition"
                      >
                        Enter Custom Address
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const addrDist = calculateHaversineDistance(
                        addr.latitude,
                        addr.longitude,
                        restaurantData?.latitude,
                        restaurantData?.longitude,
                      );
                      const addrEligible = addrDist === null || addrDist <= maxRadiusKm;

                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`cursor-pointer rounded-xl border p-3 transition flex items-center justify-between ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/30 ring-1 ring-orange-500/20'
                              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900 truncate">
                                {addr.label}
                              </span>
                              {addrDist !== null ? (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded">
                                  {addrDist} km away
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Distance unavailable
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-600 truncate">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                              {addr.city ? `, ${addr.city}` : ''}
                            </p>
                            {addr.landmark && (
                              <p className="text-[10px] text-gray-400">
                                Landmark: {addr.landmark}
                              </p>
                            )}
                            {!addrEligible && (
                              <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Exceeds delivery radius ({maxRadiusKm} km)
                              </p>
                            )}
                          </div>

                          <div
                            className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-orange-600 bg-orange-600 text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Address Preview & Real Distance Status */}
                {selectedAddress && (
                  <div className="rounded-xl bg-gray-100/70 p-3 text-xs space-y-1.5 border border-gray-200">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span className="flex items-center gap-1">
                        <Compass className="h-3.5 w-3.5 text-orange-600" />
                        <span>Address Preview</span>
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          isDeliveryEligible
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isDeliveryEligible ? 'Eligible' : 'Outside Radius'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-700">
                      <span className="font-semibold">Selected:</span> {selectedAddress.addressLine1}
                      {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}
                      {selectedAddress.city ? `, ${selectedAddress.city}` : ''}
                      {selectedAddress.postalCode ? ` - ${selectedAddress.postalCode}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                      {realDistanceKm !== null ? (
                        <span className="font-bold text-orange-700">
                          📏 Calculated Distance: {realDistanceKm} km
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700">
                          Restaurant location unavailable
                        </span>
                      )}
                    </div>

                    {!isDeliveryEligible && (
                      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900 space-y-2 mt-2">
                        <div className="flex items-center gap-1.5 font-black text-rose-700">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Sorry, we're not delivering to this location yet.</span>
                        </div>
                        <p className="text-[11px] text-rose-800">
                          This restaurant currently delivers within {maxRadiusKm} km. (Selected location is {realDistanceKm} km away). We're expanding our delivery area soon!
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowCustomAddressModal(true)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-700 transition"
                          >
                            Change Delivery Address
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                {/* Restaurant Name & Real Distance */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="h-4 w-4 text-orange-600 shrink-0" />
                    <span className="text-xs font-black text-gray-900 truncate">
                      {restaurantName || 'Selected Kitchen'}
                    </span>
                  </div>
                  {realDistanceKm !== null ? (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full shrink-0">
                      {realDistanceKm} km away
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      Distance unavailable
                    </span>
                  )}
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
                    <span>Delivery Fee ({realDistanceKm !== null ? `${realDistanceKm} km` : 'Standard'})</span>
                    <span>₹{dynamicDeliveryFee}</span>
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
              disabled={isPlacing || !isDeliveryEligible || !selectedAddress}
              className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 active:scale-[0.99] transition disabled:opacity-50"
            >
              <span>
                {isPlacing
                  ? 'Placing Order...'
                  : !selectedAddress
                  ? 'Select Delivery Address'
                  : !isDeliveryEligible
                  ? 'Outside Delivery Radius'
                  : paymentMethod === 'COD'
                  ? `Place Order • ₹${finalPayableTotal}`
                  : `Place Order & Pay • ₹${finalPayableTotal}`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CUSTOM ADDRESS FORM MODAL */}
        {showCustomAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900">Enter Custom Delivery Address</h3>
                <button
                  onClick={() => setShowCustomAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomAddress} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Save Address As</label>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setNewAddrLabel(lbl)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                          newAddrLabel === lbl
                            ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Search Delivery Address</label>
                  <AddressSearchBar 
                    onAddressSelect={(locationData) => {
                      setNewArea(locationData.address);
                      setNewLat(locationData.lat);
                      setNewLng(locationData.lng);
                      setLocationStatusMsg(null);
                    }} 
                  />

                  {newArea ? (
                    <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Selected Address:</span>
                      </div>
                      <p className="text-emerald-900 font-medium leading-relaxed">{newArea}</p>
                      {newLat !== null && newLng !== null && (
                        <p className="text-[10px] text-emerald-600 font-mono pt-0.5">
                          Coordinates: {newLat.toFixed(4)}, {newLng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-gray-400">
                      Type locality, landmark, or street name (e.g. Watlab, Bandipora, Sopore)
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-orange-600 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-800 text-xs">Or Use Device GPS</span>
                      <p className="text-[10px] text-gray-500">Detect current location automatically</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingUser}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isLocatingUser ? 'Locating...' : 'Use Current GPS'}
                  </button>
                </div>

                {locationStatusMsg && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>{locationStatusMsg}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomAddressModal(false)}
                    className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-orange-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-orange-700 transition"
                  >
                    Save &amp; Select Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerAuthGuard>
  );
}
