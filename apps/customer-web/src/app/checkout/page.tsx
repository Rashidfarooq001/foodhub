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
  const [alwaysSendCutlery, setAlwaysSendCutlery] = useState(false);
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

  // On mount, always start with null orderQuote ï¿½ never trust any rehydrated/stale value.
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

  // Custom Address Modal Form state (Manual Text Address â€” Text Form ONLY)
  const [showCustomAddressModal, setShowCustomAddressModal] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState<string>('');

  const [newAddrLabel, setNewAddrLabel] = useState<'Home' | 'Work' | 'Other'>('Home');

  const [locationError, setLocationError] = useState<string | null>(null);

  const [manualAddress, setManualAddress] = useState('');
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [matchedAddressResult, setMatchedAddressResult] = useState<any>(null);
  const [addressVerificationError, setAddressVerificationError] = useState<string | null>(null);

  // MODE 1 â€” Real-Time Geolocation Handler (Triggers ONLY on explicit user click)
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
        specialInstruction: [instructions.trim(), alwaysSendCutlery ? 'Always send cutlery' : ''].filter(Boolean).join(' | ') || undefined,
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
      <div className="bg-gray-50 min-h-screen pb-[350px] lg:pb-12">
        {/* Mobile Header & Progress Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
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

          {/* Stepper Progress */}
          <div className="mx-auto max-w-4xl mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <Link href="/cart" className="text-gray-500 hover:text-gray-900 transition hover:underline">
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
              ⚠ {paymentError}
            </div>
          )}

          {locationError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-xs flex justify-between">
              <span>⚠ {locationError}</span>
              <button onClick={() => setLocationError(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT COLUMN: Order Details & Price */}
            <div className="lg:col-span-7 space-y-4">
              {/* Order Items */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3 pb-3 border-b border-gray-100">
                  <Store className="h-4 w-4 text-orange-600" />
                  <span>Order Items</span>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900 shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
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
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectTip(parseInt(customTip) || 0)}
                      className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3 pb-3 border-b border-gray-100">
                  <Banknote className="h-4 w-4 text-orange-600" />
                  <span>Price Breakdown</span>
                </div>
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {dynamicDeliveryFee !== null ? (
                      <span className="font-bold text-gray-900">₹{dynamicDeliveryFee}</span>
                    ) : (
                      <span className="text-amber-700 font-bold text-[11px]">Pending distance</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-gray-900">₹{platformFee ?? 3}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="font-bold text-gray-900">₹{tax}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Driver Tip</span>
                    <span className="font-bold">+₹{tipAmount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN / STICKY BOTTOM BAR: Checkout Actions */}
            <div className="lg:col-span-5 relative">
              <div className="fixed bottom-0 left-0 right-0 z-40 lg:static lg:block bg-white rounded-t-3xl lg:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-sm border-t lg:border border-gray-100 p-4 sm:p-5 space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-5">
                
                {/* 1. DELIVERY ADDRESS */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 min-w-0 pr-2">
                    <div className="mt-1">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide truncate">{selectedAddress?.label || 'Delivery Address'}</h3>
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5 max-w-[240px]">
                        {selectedAddress ? `${selectedAddress.addressLine1}, ${selectedAddress.city}` : 'No address selected'}
                      </p>
                      
                      {selectedAddress ? (
                        <p className="text-xs font-bold text-gray-800 mt-1 flex items-center gap-1">
                          {orderQuote && routeAvailable && realDistanceKm !== null ? (
                            <>
                              <span className={isDeliveryEligible ? 'text-emerald-700' : 'text-rose-700'}>
                                {realDistanceKm} km
                              </span>
                              <span className="text-gray-300">•</span>
                              <span>{orderQuote.etaMinutes ? `${orderQuote.etaMinutes} MINS` : ''}</span>
                            </>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">Calculating ETA...</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-rose-600 mt-1">Select an address to continue</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setManualAddress('');
                      setMatchedAddressResult(null);
                      setAddressVerificationError(null);
                      setShowCustomAddressModal(true);
                    }} 
                    className="text-[10px] font-black text-orange-600 uppercase tracking-wide px-3 py-1.5 bg-orange-50 hover:bg-orange-100 transition rounded-lg shrink-0 border border-orange-100"
                  >
                    CHANGE
                  </button>
                </div>

                {/* 2. CUTLERY PREFERENCE */}
                <div className="flex items-center gap-2 border-y border-gray-100 py-3">
                  <input 
                    type="checkbox" 
                    id="cutlery" 
                    checked={alwaysSendCutlery} 
                    onChange={(e) => setAlwaysSendCutlery(e.target.checked)} 
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500" 
                  />
                  <label htmlFor="cutlery" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Always send cutlery to this address
                  </label>
                </div>

                {/* 3. PAYMENT METHOD */}
                <div className="flex flex-col gap-2 pt-1 pb-2">
                  <span className="text-[10px] font-black text-gray-400 tracking-wider">PAY USING</span>
                  <div className="flex gap-2 mt-1">
                    {['UPI', 'CARD', 'COD'].map((method) => (
                      <button 
                        key={method} 
                        onClick={() => setPaymentMethod(method as any)} 
                        className={`flex-1 py-3 rounded-xl text-xs font-black border transition-colors ${
                          paymentMethod === method 
                            ? 'border-orange-500 bg-orange-50 text-orange-700' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {method === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                          {method === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                          {method === 'COD' && <Banknote className="w-3.5 h-3.5" />}
                          {method === 'CARD' ? 'Card' : method}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. TOTAL & PLACE ORDER CTA */}
                <div className="flex gap-3 pt-1">
                  <div className="flex flex-col justify-center bg-gray-50 px-4 rounded-2xl border border-gray-200 min-w-[110px] shadow-inner">
                    <span className="text-[10px] font-black text-gray-500">TOTAL</span>
                    <span className="text-lg font-black text-gray-900">₹{finalPayableTotal}</span>
                  </div>
                  
                  <button
                    onClick={orderQuote && (!routeAvailable || realDistanceKm === null) ? refreshQuote : handlePlaceOrder}
                    disabled={isPlacing || !selectedAddress || Boolean(orderQuote && routeAvailable && realDistanceKm !== null && !isDeliveryEligible)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition text-white font-black text-sm rounded-2xl py-4 flex items-center justify-between px-5 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <span>
                      {isPlacing 
                        ? 'Placing Order...' 
                        : !selectedAddress 
                          ? 'Select Address' 
                          : orderQuote && (!routeAvailable || realDistanceKm === null)
                            ? 'Check Distance'
                            : !isDeliveryEligible 
                              ? 'Out of Range' 
                              : 'Place Order'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MANUAL ADDRESS MODAL */}
        {showCustomAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl">
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingUser}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-50 px-3 py-3 text-xs font-bold text-orange-700 hover:bg-orange-100 transition disabled:opacity-50 border border-orange-100"
                  >
                    <MapPin className={`h-4 w-4 ${isLocatingUser ? 'animate-spin' : ''}`} />
                    <span>{isLocatingUser ? 'Locating...' : 'Use Current GPS'}</span>
                  </button>
                </div>
                
                {addresses.length > 0 && (
                  <div className="space-y-2 mt-4 border-t border-gray-100 pt-4">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
                      Saved Addresses
                    </label>
                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr.id);
                            setShowCustomAddressModal(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedAddress?.id === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <p className="text-xs font-black text-gray-900 uppercase">{addr.label}</p>
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">{addr.addressLine1}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 border-t border-gray-100 pt-4">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider px-1">
                    Enter Custom Address
                  </label>
                  <textarea
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="e.g. House No 24, Kenusa, Dangarpora, Baramulla..."
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none shadow-sm box-border h-[80px]"
                  />
                  <button
                    onClick={handleConfirmManualAddress}
                    disabled={!manualAddress.trim() || isVerifyingAddress}
                    className="w-full flex items-center justify-center rounded-xl bg-orange-600 h-[52px] text-sm font-black text-white hover:bg-orange-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {isVerifyingAddress ? 'Verifying location...' : 'Save & Select Location'}
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
