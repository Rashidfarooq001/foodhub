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
import { formatCurrency } from '@foodhub/utils';

const API_BASE = getApiBaseUrl();

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export default function CheckoutPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    console.log('CHECKOUT_VERSION = "FINAL-CHECKOUT-2026-08-15"');
    console.log('QUOTE_SOURCE = "BACKEND-ORDER-QUOTE"');
  }, []);
  const { items, restaurantName, getSubtotal, getTaxAmount, getGrandTotal, clearCart } =
    useCartStore();

  const { addresses, selectedAddressId, setSelectedAddress, getSelectedAddress, addAddress } = useAddressStore();
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
  const [recommendedItems, setRecommendedItems] = useState<any[]>([]);

  useEffect(() => {
    const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
    if (!restId) return;
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/menus/restaurant/${restId}`);
        if (res.ok) {
          const menuData = await res.json();
          if (Array.isArray(menuData) && menuData.length > 0) {
              let allItems = menuData;
              let recs = allItems.filter(i => i.isRecommended || i.isBestseller);
              if (recs.length === 0) recs = allItems;
              const cartIds = new Set(items.map(i => i.foodItemId || i.id));
              recs = recs.filter(i => !cartIds.has(i.id));
              setRecommendedItems(recs.slice(0, 3));
            }
        }
      } catch (err) {}
    };
    fetchMenu();
  }, [items]);
  
  const handleAddRecommended = (item: any) => {
    useCartStore.getState().addItem({
      restaurantId: item.restaurantId,
      restaurantName: restaurantName || 'Restaurant',
      foodItemId: item.id,
      isVeg: item.isVeg || false,
      addons: [],
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || '',
      });
  };

  const currentLocation = getSelectedAddress();
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

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    try {
      useCartStore.getState().applyCoupon(couponInput.trim());
      refreshQuote();
      setCouponMessage({ type: 'success', text: 'Coupon applied successfully!' });
    } catch (e: any) {
      setCouponMessage({ type: 'error', text: e.message || 'Invalid coupon' });
      useCartStore.getState().removeCoupon();
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    useCartStore.getState().removeCoupon();
    setCouponInput('');
    setCouponMessage(null);
    refreshQuote();
  };

  const refreshQuote = useCallback(() => {
    const sub = getSubtotal();
    const restId = useCartStore.getState().restaurantId || items[0]?.restaurantId;
    const hasCoords = selectedAddress?.latitude !== null && selectedAddress?.latitude !== undefined && selectedAddress?.longitude !== null && selectedAddress?.longitude !== undefined;
    const locationSource = (selectedAddress as any)?.locationSource || (selectedAddress?.id === 'current-location' ? 'CURRENT_GPS' : 'MANUAL_GEOCODED');

    fetchOrderQuote({
      foodSubtotal: sub,
      restaurantId: restId || undefined,
      latitude: hasCoords ? selectedAddress!.latitude! : undefined,
      longitude: hasCoords ? selectedAddress!.longitude! : undefined,
      locationSource,
      tipAmount: tipAmount,
      couponCode: useCartStore.getState().appliedCoupon || undefined,
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
  const discount = orderQuote?.discountAmount ?? 0;
  const baseGrandTotal = subtotal + (dynamicDeliveryFee || 0) + platformFee + tax - discount;
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
      <div className="bg-gray-50 text-gray-900 -mb-20 md:mb-0">
        {/* Mobile-first Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <button
              onClick={() => router.push('/cart')}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-black uppercase tracking-wider text-gray-900">Payment</h1>
          </div>
        </div>

        {/* SINGLE COLUMN MOBILE-FIRST LAYOUT */}
        <div className="mx-auto max-w-2xl px-4 pt-4 space-y-4">
          
          {paymentError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          {locationError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 shadow-sm flex justify-between items-start">
              <span className="flex items-start gap-2">
                 <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                 {locationError}
              </span>
              <button onClick={() => setLocationError(null)} className="p-1 -mr-1 text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* 1. CURRENT DELIVERY ADDRESS */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start justify-between">
            <div className="flex gap-3 min-w-0">
              <div className="mt-0.5"><MapPin className="w-5 h-5 text-orange-600" /></div>
              <div className="min-w-0 pr-2">
                 <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                   {currentLocation?.label || 'CURRENT LOCATION'}
                 </h2>
                 <p className="text-xs font-medium text-gray-500 mt-1 truncate">
                   {currentLocation ? `${currentLocation.addressLine1}, ${currentLocation.city}` : 'No address selected'}
                 </p>
                 <p className="text-xs font-bold text-gray-800 mt-1">
                   {orderQuote && routeAvailable && realDistanceKm !== null ? (
                      <span className={isDeliveryEligible ? 'text-emerald-700' : 'text-rose-700'}>
                         {realDistanceKm} km away
                      </span>
                   ) : 'Calculating distance...'}
                 </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setManualAddress('');
                setMatchedAddressResult(null);
                setAddressVerificationError(null);
                setShowCustomAddressModal(true);
              }}
              className="text-[10px] font-black text-orange-600 uppercase tracking-wide px-3 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition shrink-0"
            >
              CHANGE
            </button>
          </div>

          {/* 2. RESTAURANT / ORDER */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                  {restaurantName || 'Your Order'}
                </h2>
             </div>
             <div className="space-y-3 pb-4 mb-3 border-b border-gray-100">
               {items.map((item) => (
                 <div key={item.id} className="flex justify-between text-xs items-center gap-2">
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     <span className="font-bold text-gray-900 text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-center min-w-[24px]">
                       {item.quantity}×
                       </span>
                     <span className="font-bold text-gray-800 truncate leading-snug">{item.name}</span>
                   </div>
                   <span className="font-black text-gray-900 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                 </div>
               ))}
             </div>
             <button
                onClick={() => router.push('/cart')}
                className="w-full text-xs font-black text-orange-600 uppercase tracking-wider text-center flex justify-center items-center py-1 hover:text-orange-700 transition"
             >
                EDIT / ADD MORE
             </button>
          </div>

          {/* 3. RECOMMENDED ITEMS */}
          {recommendedItems && recommendedItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
               <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Recommended Items</h2>
               <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                 {recommendedItems.map(item => (
                   <div key={item.id} className="flex-shrink-0 w-32 border border-gray-100 rounded-xl p-2 flex flex-col justify-between">
                      <div>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                        ) : (
                          <div className="w-full h-20 bg-orange-50 rounded-lg mb-2 flex items-center justify-center text-orange-300">
                            <Store className="w-6 h-6" />
                          </div>
                        )}
                        <h3 className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</h3>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                        <span className="text-xs font-black text-gray-900">{formatCurrency(item.price)}</span>
                        <button 
                          onClick={() => handleAddRecommended(item)}
                          className="bg-orange-50 text-orange-600 p-1 rounded-md hover:bg-orange-100 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* 4. DELIVERY TIME */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
             <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Delivery Time</h2>
             <span className="text-sm font-black text-gray-900">
               {orderQuote?.etaMinutes ? `${orderQuote.etaMinutes} mins` : 'ETA unavailable'}
             </span>
          </div>

          {/* 5. DELIVERY ADDRESS & CUSTOMER INFO */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
               <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Delivery Address</h2>
               <button 
                  onClick={() => setShowCustomAddressModal(true)}
                  className="text-[10px] font-black text-orange-600 uppercase tracking-wide"
               >
                 CHANGE
               </button>
            </div>
            <div className="text-xs font-bold text-gray-900 space-y-1">
               <p className="text-sm">{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer' : 'Customer'}</p>
               <p className="text-gray-600 font-medium">{user?.phone || ''}</p>
               <p className="text-gray-500 font-medium leading-relaxed pt-1 max-w-[90%]">
                 {selectedAddress ? `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}, ${selectedAddress.city} - ${selectedAddress.postalCode}` : 'No address selected'}
               </p>
            </div>
            
            <div className="flex items-center gap-2 border-t border-gray-100 mt-4 pt-3">
              <input 
                type="checkbox" 
                id="cutlery" 
                checked={alwaysSendCutlery} 
                onChange={(e) => setAlwaysSendCutlery(e.target.checked)} 
                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 transition cursor-pointer" 
              />
              <label htmlFor="cutlery" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                Always send cutlery to this address
              </label>
            </div>
          </div>

          {/* 5.5. COUPON */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
              <Tag className="w-5 h-5 text-gray-900" /> APPLY COUPON
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={isApplyingCoupon || !!useCartStore.getState().appliedCoupon}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm uppercase font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50"
              />
              {!useCartStore.getState().appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || isApplyingCoupon}
                  className="rounded-xl bg-gray-900 px-6 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {isApplyingCoupon ? '...' : 'APPLY'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {couponMessage && (
              <p className={`text-xs font-bold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {couponMessage.text}
              </p>
            )}
            {/* Show applied coupon message from store if quote returned a message */}
            {!couponMessage && useCartStore.getState().appliedCoupon && orderQuote?.couponMessage && (
              <p className="text-xs font-bold text-green-600">
                {orderQuote?.couponMessage}
              </p>
            )}
          </div>

          {/* 5.5. COUPON */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
              <Tag className="w-5 h-5 text-gray-900" /> APPLY COUPON
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={isApplyingCoupon || !!useCartStore.getState().appliedCoupon}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm uppercase font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:bg-gray-50 text-gray-900"
              />
              {!useCartStore.getState().appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || isApplyingCoupon}
                  className="rounded-xl bg-gray-900 px-6 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {isApplyingCoupon ? '...' : 'APPLY'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {couponMessage && (
              <p className={`text-xs font-bold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {couponMessage.text}
              </p>
            )}
            {/* Show applied coupon message from store if quote returned a message */}
            {!couponMessage && useCartStore.getState().appliedCoupon && orderQuote?.couponMessage && (
              <p className="text-xs font-bold text-green-600">
                {orderQuote?.couponMessage}
              </p>
            )}
          </div>

          {/* 6. PRICE BREAKDOWN */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
             <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
               <Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN
             </h2>
             <div className="space-y-2.5 text-xs font-medium text-gray-600">
                <div className="flex justify-between">
                    <span>Item Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Item Discount</span>
                      <span className="font-bold">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {dynamicDeliveryFee !== null ? (
                      <span className="font-bold text-gray-900">{formatCurrency(dynamicDeliveryFee)}</span>
                    ) : (
                      <span className="text-amber-700 font-bold text-[11px]">Pending distance</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-gray-900">{formatCurrency(platformFee ?? 3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="font-bold text-gray-900">{formatCurrency(tax)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Driver Tip</span>
                    <span className="font-bold">+{formatCurrency(tipAmount)}</span>
                  </div>
                )}
             </div>
          </div>

          {/* 7. TOTAL BILL */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
             <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Total Bill</h2>
             <span className="text-xl font-black text-orange-600">{formatCurrency(finalPayableTotal)}</span>
          </div>

          {/* 8. PAY USING */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-gray-400" /> PAY USING
                </h2>
                <button 
                  onClick={() => setPaymentMethod(prev => prev === 'COD' ? 'UPI' : 'COD')}
                  className="text-[10px] font-black text-orange-600 uppercase tracking-wide px-2 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                >
                  CHANGE
                </button>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-900">
                  {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
             </div>
          </div>

        </div>

        {/* 9. STICKY BOTTOM CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <div className="flex flex-col justify-center px-2 min-w-[70px]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Total</span>
              <span className="text-lg font-black text-gray-900">{formatCurrency(finalPayableTotal)}</span>
            </div>
            
            <button
              onClick={orderQuote && (!routeAvailable || realDistanceKm === null) ? refreshQuote : handlePlaceOrder}
              disabled={isPlacing || !selectedAddress || Boolean(orderQuote && routeAvailable && realDistanceKm !== null && !isDeliveryEligible)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition text-white font-black text-sm rounded-xl py-3.5 flex items-center justify-between px-5 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-orange-500/20"
            >
              <span>
                {isPlacing 
                  ? 'PROCESSING...' 
                  : !selectedAddress ? 'SELECT ADDRESS' 
                    : orderQuote && (!routeAvailable || realDistanceKm === null)
                      ? 'CHECK DISTANCE'
                      : !isDeliveryEligible 
                        ? 'OUT OF RANGE' 
                        : (paymentMethod === 'COD' ? (<span className="flex items-center gap-1">PLACE ORDER <ArrowRight className="w-4 h-4" /></span>) : (<span className="flex items-center gap-1">PROCEED TO PAYMENT <ArrowRight className="w-4 h-4" /></span>))}
              </span>
            </button>
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

