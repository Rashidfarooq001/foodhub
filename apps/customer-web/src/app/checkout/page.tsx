'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Plus,
  AlertTriangle,
  X,
  Search,
} from 'lucide-react';

import { useCartStore } from '../../stores/use-cart-store';
import { useAddressStore, CustomerAddressItem } from '../../stores/use-address-store';
import { useAuthStore } from '../../stores/use-auth-store';
import { CustomerAuthGuard } from '../../components/common/CustomerAuthGuard';
import { getApiBaseUrl } from '@foodhub/config';
import {
  fetchPricingConfig,
  forwardGeocodeAddress,
  forwardGeocodeStructuredAddress,
  fetchOrderQuote,
  OrderQuoteData,
  PricingConfigData,
  DEFAULT_PRICING_CONFIG_DATA,
} from '@foodhub/api-client';
import { useGeolocation } from '../../hooks/useGeolocation';

const API_BASE = getApiBaseUrl();

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export default function CheckoutPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    console.log('CHECKOUT_VERSION = "FINAL-CHECKOUT-2026-08-15"');
    console.log('QUOTE_SOURCE = "BACKEND-ORDER-QUOTE"');
  }, []);
  const { items, restaurantName, getSubtotal, getTaxAmount, getGrandTotal, clearCart } =
    useCartStore();

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
          const lng =
            typeof data.longitude === 'number' ? data.longitude : parseFloat(data.longitude);

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

  const [pricingConfig, setPricingConfig] = useState<PricingConfigData>(
    DEFAULT_PRICING_CONFIG_DATA,
  );

  useEffect(() => {
    fetchPricingConfig().then(setPricingConfig);
  }, []);

  // Calculate real customer <-> restaurant distance

  const [orderQuote, setOrderQuote] = useState<OrderQuoteData | null>(null);

  // On mount, always start with null orderQuote � never trust any rehydrated/stale value.
  // The quote will be freshly fetched by the useEffect below.
  // This guards against any stale distanceKm (e.g. -1) surviving a page refresh.
  const _rawDistanceKm = orderQuote?.distanceKm ?? null;
  const realDistanceKm =
    _rawDistanceKm !== null && Number.isFinite(_rawDistanceKm) && _rawDistanceKm >= 0
      ? _rawDistanceKm
      : null;
  const routeAvailable = orderQuote
    ? Boolean(orderQuote.routeAvailable) && realDistanceKm !== null
    : false;

  const dynamicDeliveryFee =
    orderQuote &&
    routeAvailable &&
    realDistanceKm !== null &&
    typeof orderQuote.customerDeliveryFee === 'number'
      ? orderQuote.customerDeliveryFee
      : null;

  const platformFee = orderQuote?.platformFee ?? 3.0;
  const subtotal = getSubtotal();
  const smallOrderFee = 0.0;

  const maxRadiusKm = restaurantData?.deliveryRadius ?? 15.0;
  const isDeliveryEligible = Boolean(orderQuote && routeAvailable && orderQuote.deliveryEligible);

  const refreshQuote = useCallback(() => {
    const sub = getSubtotal();
    const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
    const hasCoords =
      selectedAddress?.latitude !== null &&
      selectedAddress?.latitude !== undefined &&
      selectedAddress?.longitude !== null &&
      selectedAddress?.longitude !== undefined;
    const locationSource =
      (selectedAddress as any)?.locationSource ||
      (selectedAddress?.id === 'current-location' ? 'CURRENT_GPS' : 'MANUAL_GEOCODED');

    console.log('[Checkout Location]', {
      source: locationSource,
      hasCoordinates: hasCoords,
      locality: selectedAddress?.placeName || selectedAddress?.addressLine1,
      district: selectedAddress?.city,
      state: selectedAddress?.state,
      pincode: selectedAddress?.postalCode,
    });

    fetchOrderQuote({
      foodSubtotal: sub,
      restaurantId: restId || undefined,
      latitude: hasCoords ? selectedAddress!.latitude! : undefined,
      longitude: hasCoords ? selectedAddress!.longitude! : undefined,
      locationSource,
      tipAmount: tipAmount,
      discountAmount: 0,
      customerState: selectedAddress?.state || 'J&K',
      restaurantState: 'J&K',
    })
      .then((quote) => {
        if (quote) setOrderQuote(quote);
      })
      .catch((err) => {
        setPaymentError(err.message || 'Failed to calculate delivery fee.');
        setOrderQuote(null);
      });
  }, [items, selectedAddress, tipAmount]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const tax = orderQuote?.totalCustomerTaxes ?? 0;
  const discount = 0;
  const baseGrandTotal = subtotal + (dynamicDeliveryFee || 0) + platformFee + tax;
  const finalPayableTotal = orderQuote
    ? orderQuote.customerTotal
    : Math.max(0, baseGrandTotal) + tipAmount;

  // Custom Address Modal Form state (Manual Text Address — Text Form ONLY)
  const [showCustomAddressModal, setShowCustomAddressModal] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState<string>('');

  const [newAddrLabel, setNewAddrLabel] = useState<'Home' | 'Work' | 'Other'>('Home');

  const [locationError, setLocationError] = useState<string | null>(null);

  const [manualAddress, setManualAddress] = useState('');
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [matchedAddressResult, setMatchedAddressResult] = useState<any>(null);
  const [addressVerificationError, setAddressVerificationError] = useState<string | null>(null);

  // MODE 1 — Real-Time Geolocation Handler (Triggers ONLY on explicit user click)
  const { status: gpsStatus, error: gpsError, requestLocation } = useGeolocation();
  const isLocatingUser = gpsStatus === 'requesting';

  const handleUseCurrentLocation = async () => {
    setLocationError(null);
    const res = await requestLocation();

    if (res) {
      const { coords, address } = res;

      console.log('[GPS] Native coordinates detected:', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
      console.log('[Mappls Rev-Geocode] Raw response:', address);

      const locality = (address.locality || address.village || address.subLocality || '').trim();
      const subDistrict = ((address as any).subDistrict || '').trim();
      const district = (address.district || address.city || '').trim();
      const state = (address.state || 'Jammu & Kashmir').trim();
      const pincode = (address.pincode || address.postalCode || '').trim();

      const specificName = locality || subDistrict || district || 'Current Location';
      const addressLine2 = [subDistrict, district]
        .filter(Boolean)
        .filter((d) => d !== specificName)
        .join(', ');

      const gpsAddr: CustomerAddressItem = {
        id: 'current-location',
        label: 'Current Location',
        placeName: specificName,
        addressLine1: specificName,
        addressLine2: addressLine2 || undefined,
        city: district || 'Jammu & Kashmir',
        state: state,
        postalCode: pincode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        locationSource: 'CURRENT_GPS',
        verificationStatus: 'VERIFIED',
        isDefault: false,
      };

      addAddress(gpsAddr);
      setSelectedAddress('current-location');
      setShowCustomAddressModal(false);
    } else {
      setLocationError(gpsError || 'Unable to retrieve location.');
    }
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

  const handleVerifyManualAddress = async () => {};

  const handleConfirmManualAddress = async () => {
    if (!manualAddress.trim()) return;

    setIsVerifyingAddress(true);
    setAddressVerificationError(null);

    try {
      const res = await fetch(`${API_BASE}/location/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: manualAddress.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.latitude && data.longitude) {
        const newAddr = {
          id: 'addr-manual-' + Date.now(),
          label: 'Manual Address',
          placeName: data.formattedAddress || 'Manual Address',
          addressLine1: manualAddress.trim(),
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          latitude: data.latitude,
          longitude: data.longitude,
          locationSource: 'MANUAL_GEOCODED' as const,
          verificationStatus: 'VERIFIED' as const,
          isDefault: false,
        };

        addAddress(newAddr as any);
        setSelectedAddress(newAddr.id);
        setShowCustomAddressModal(false);

        setOrderQuote(null);
        setLocationError(null);

        setManualAddress('');
        setMatchedAddressResult(null);
      } else {
        setAddressVerificationError(
          data.message || "Couldn't verify this location. Please enter a more specific address.",
        );
      }
    } catch (err) {
      setAddressVerificationError('Network error while verifying location. Please try again.');
    } finally {
      setIsVerifyingAddress(false);
    }
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

    if (!accessToken) {
      setPaymentError('Please log in to your account to place your order.');
      router.push('/login?redirect=/checkout');
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
          variantId: item.variantId && isUUID(item.variantId) ? item.variantId : undefined,
          variantName: item.variantName || undefined,
          quantity: item.quantity || 1,
          addonsJson:
            item.addons && item.addons.length > 0
              ? item.addons.map((a) => ({ addonId: a.id, name: a.name, price: a.price }))
              : undefined,
        };
      });

      let cleanCity = selectedAddress.city;
      let cleanState = selectedAddress.state;
      let cleanLine2 = selectedAddress.addressLine2 || '';

      // Removed Bandipora fallback per user request
      // Removed J&K fallback
      if (cleanLine2.includes('GPS Coordinates')) cleanLine2 = '';

      const addressPayload = {
        label: selectedAddress.label || 'Current Location',
        street: selectedAddress.addressLine1,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: cleanLine2,
        landmark: selectedAddress.landmark || '',
        city: cleanCity,
        state: cleanState,
        postalCode: selectedAddress.postalCode || '193502',
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        locationSource: (selectedAddress as any).locationSource || 'CURRENT_GPS',
      };

      const validPaymentMethod =
        paymentMethod === 'COD' ? 'COD' : paymentMethod === 'CARD' ? 'CARD' : 'UPI';

      const createOrderPayload = {
        restaurantId: cartRestaurantId,
        items: itemsPayload,
        deliveryAddress: addressPayload,
        paymentMethod: validPaymentMethod,
        specialInstruction: instructions.trim() || undefined,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
      };

      const forbidden = [
        'taxSnapshot',
        'pricingSnapshot',
        'customerTotal',
        'customerDeliveryFee',
        'platformFee',
        'smallOrderFee',
        'packagingFee',
        'distanceKm',
        'restaurantCommission',
        'riderPayout',
        'paymentGatewayCost',
        'platformContributionMargin',
      ];

      for (const key of forbidden) {
        if (key in createOrderPayload) {
          throw new Error(`INVALID CREATE ORDER PAYLOAD: ${key} must not be sent by customer`);
        }
      }

      console.log('FINAL POST /orders PAYLOAD', JSON.stringify(createOrderPayload, null, 2));

      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(createOrderPayload),
      });

      if (orderRes.status === 401) {
        useAuthStore.getState().logout();
        setPaymentError('Your session has expired. Please log in again.');
        router.push('/login?redirect=/checkout&expired=true');
        return;
      }

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
        typeof window !== 'undefined' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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
            setPaymentError(
              `Order #${createdOrder.orderNumber || orderId} created! Payment process was closed.`,
            );
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

  if (!isHydrated) {
    return (
      <div className="bg-gray-50/50 p-4 flex flex-col items-center justify-center py-20">
        <div className="h-8 w-48 rounded-xl bg-gray-200 animate-pulse mb-4" />
        <div className="h-64 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="h-6 w-3/4 rounded bg-gray-200 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-gray-200 animate-pulse" />
          <div className="h-10 w-full rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-xs text-gray-500">
          Add items from your favorite local kitchen to proceed.
        </p>
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

        <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-4 lg:px-5 space-y-4">
          {paymentError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-xs">
              ⚠️ {paymentError}
            </div>
          )}

          {/* Main 2-Column Responsive Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT COLUMN: Delivery Location & Options */}
            <div className="lg:col-span-7 space-y-4">
              {/* Delivery Address Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span>Delivery Address</span>
                  </div>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCustomAddressModal(true)}
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      Change
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pb-4">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingUser}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 px-3 py-2.5 text-[11px] sm:text-xs font-bold text-orange-700 hover:bg-orange-100 transition disabled:opacity-50 border border-orange-100"
                  >
                    <MapPin className={`h-3.5 w-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
                    <span>{isLocatingUser ? 'Locating...' : 'Use Current Location'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualAddress('');
                      setMatchedAddressResult(null);
                      setAddressVerificationError(null);

                      setShowCustomAddressModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2.5 text-[11px] sm:text-xs font-bold text-gray-700 hover:bg-gray-200 transition border border-gray-200"
                  >
                    <Search className="h-3.5 w-3.5 text-gray-500" />
                    <span>Change Location</span>
                  </button>
                </div>

                {locationError && (
                  <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-2 text-[11px] font-bold text-rose-700 flex items-center justify-between">
                    <span>⚠️ {locationError}</span>
                    <button
                      type="button"
                      onClick={() => setLocationError(null)}
                      className="text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-4 text-center">
                    <p className="text-xs font-bold text-gray-900">No Saved Delivery Address</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Please select a location above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      if (!isSelected) return null; // ONLY SHOW SELECTED ADDRESS TO SAVE SPACE

                      const hasCoords =
                        addr.latitude !== null &&
                        addr.latitude !== undefined &&
                        addr.longitude !== null &&
                        addr.longitude !== undefined;
                      const addrDist =
                        hasCoords &&
                        isSelected &&
                        orderQuote?.distanceKm !== null &&
                        orderQuote?.distanceKm !== undefined &&
                        orderQuote.distanceKm >= 0
                          ? orderQuote.distanceKm
                          : null;
                      const addrRouteAvailable = isSelected
                        ? (orderQuote?.routeAvailable ?? true)
                        : true;
                      const addrEligible = isSelected
                        ? (orderQuote?.deliveryEligible ??
                          (addrDist !== null && addrDist <= maxRadiusKm))
                        : true;

                      return (
                        <div key={addr.id} className="pt-2 border-t border-gray-100 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-[10px]">
                            <span className="font-black text-gray-900 uppercase tracking-wide">
                              {addr.label}
                            </span>
                            {hasCoords && (
                              <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                                <Check className="h-3 w-3" /> Address location verified
                              </span>
                            )}
                          </div>

                          {addrRouteAvailable && addrDist !== null ? (
                            <div className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                              <span>{addrDist} km away</span>
                              <span>·</span>
                              <span className={addrEligible ? 'text-emerald-700' : 'text-rose-700'}>
                                {addrEligible
                                  ? `✓ Inside delivery radius (${maxRadiusKm} km)`
                                  : `✕ Outside delivery radius (${maxRadiusKm} km)`}
                              </span>
                            </div>
                          ) : !addrRouteAvailable || addrDist === null ? (
                            <div className="text-[10px] font-bold text-amber-700">
                              ⚠️ Unable to calculate delivery distance.
                            </div>
                          ) : null}

                          <div className="pt-1 text-[11px] leading-snug text-gray-800">
                            <p className="font-bold text-gray-900">{addr.addressLine1}</p>
                            {addr.addressLine2 && addr.addressLine2 !== addr.addressLine1 && (
                              <p>{addr.addressLine2}</p>
                            )}
                            {(addr.city || addr.state || addr.postalCode) && (
                              <p className="text-gray-500">
                                {[addr.city, addr.state].filter(Boolean).join(', ')}
                                {addr.postalCode && addr.postalCode !== 'India'
                                  ? ` - ${addr.postalCode}`
                                  : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Delivery Instructions */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <span>Delivery Instructions</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Leave at gate, do not ring bell..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Tip Your Driver */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <HeartHandshake className="h-4 w-4 text-orange-600" />
                    <span>Tip Your Driver</span>
                  </div>
                  <span className="text-[10px] text-gray-400">100% goes to driver</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[20, 30, 50].map((amt) => {
                    const isSelected = tipAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectTip(amt)}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition text-center flex items-center justify-center ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomTipInput(!showCustomTipInput)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition text-center flex items-center justify-center ${
                      showCustomTipInput || (tipAmount > 0 && ![20, 30, 50].includes(tipAmount))
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {showCustomTipInput && (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      placeholder="Enter tip ₹"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTip}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <span>Payment Method</span>
                </div>

                <div className="space-y-2.5">
                  <div
                    onClick={() => setPaymentMethod('UPI')}
                    className={`cursor-pointer rounded-xl border p-3 transition flex items-center justify-between ${
                      paymentMethod === 'UPI'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">UPI Instant Pay</p>
                        <p className="text-[10px] text-gray-500">
                          Google Pay, PhonePe, Paytm, BHIM
                        </p>
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
                    className={`cursor-pointer rounded-xl border p-3 transition flex items-center justify-between ${
                      paymentMethod === 'CARD'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">Credit / Debit Card</p>
                        <p className="text-[10px] text-gray-500">Visa, Mastercard, RuPay Cards</p>
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
                    className={`cursor-pointer rounded-xl border p-3 transition flex items-center justify-between ${
                      paymentMethod === 'COD'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">Cash on Delivery</p>
                        <p className="text-[10px] text-gray-500">Pay cash upon order arrival</p>
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

                {/* Fee Breakdown */}
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Food Subtotal</span>
                    <span>&#x20B9;{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>
                      {dynamicDeliveryFee !== null ? (
                        `₹${dynamicDeliveryFee}`
                      ) : (
                        <span className="text-amber-700 font-semibold text-[11px]">
                          Pending distance
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>&#x20B9;{platformFee ?? 3}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST &amp; Taxes</span>
                    <span>&#x20B9;{tax}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-orange-600 font-bold">
                      <span>Rider Tip (100% to rider)</span>
                      <span>+₹{tipAmount}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-black text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600 text-base">₹{finalPayableTotal}</span>
                  </div>
                </div>

                {/* Legal & Policy Acknowledgment */}
                <div className="border-t border-gray-100 pt-3 text-[11px] text-gray-500 leading-relaxed">
                  <p>
                    By placing this order, you agree to Zayka Food&apos;s{' '}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      className="font-bold text-orange-600 hover:underline"
                    >
                      Terms &amp; Conditions
                    </Link>{' '}
                    and acknowledge our{' '}
                    <Link
                      href="/refund-policy"
                      target="_blank"
                      className="font-bold text-orange-600 hover:underline"
                    >
                      Refund Policy
                    </Link>
                    ,{' '}
                    <Link
                      href="/delivery-policy"
                      target="_blank"
                      className="font-bold text-orange-600 hover:underline"
                    >
                      Delivery Policy
                    </Link>
                    , and{' '}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="font-bold text-orange-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating/Fixed Bottom Payment Button for Mobile & Desktop */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <span className="text-[11px] font-semibold text-gray-500 block">Total Payable</span>
              <span className="text-lg font-black text-gray-900">₹{finalPayableTotal}</span>
            </div>

            <button
              onClick={
                orderQuote && (!routeAvailable || realDistanceKm === null)
                  ? refreshQuote
                  : handlePlaceOrder
              }
              disabled={
                isPlacing ||
                !selectedAddress ||
                Boolean(
                  orderQuote && routeAvailable && realDistanceKm !== null && !isDeliveryEligible,
                )
              }
              className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 sm:py-4 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 active:scale-[0.99] transition disabled:opacity-50"
            >
              <span>
                {isPlacing
                  ? 'Placing Order...'
                  : !selectedAddress
                    ? 'Select Delivery Address'
                    : orderQuote && (!routeAvailable || realDistanceKm === null)
                      ? '⚠️ Distance Unavailable'
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

        {/* MANUAL ADDRESS MODAL */}
        {showCustomAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 pb-3">
                <h2 className="text-base font-black text-gray-900">Change Delivery Location</h2>
                <button
                  onClick={() => setShowCustomAddressModal(false)}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 pt-3 space-y-4">
                {/* MANUAL TEXT ENTRY */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
                    Delivery Address
                  </label>
                  <textarea
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla, Jammu & Kashmir - 193201"
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all shadow-sm box-border h-[80px]"
                  />
                  <button
                    onClick={handleConfirmManualAddress}
                    disabled={!manualAddress.trim() || isVerifyingAddress}
                    className="w-full flex items-center justify-center rounded-xl bg-orange-600 h-[52px] text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 disabled:bg-gray-300 shadow-sm"
                  >
                    {isVerifyingAddress ? 'Verifying location...' : 'Save Location'}
                  </button>
                  {addressVerificationError && (
                    <p className="mt-1.5 text-[11px] font-bold text-red-500 text-center leading-tight">
                      {addressVerificationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerAuthGuard>
  );
}

// FORCE DEPLOY
