'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Bell,
  Search,
  Mic,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { CategoryCarousel } from '../components/home/CategoryCarousel';
import { RecommendedCard } from '../components/home/RecommendedCard';
import { LocationSelectorModal } from '../components/home/LocationSelectorModal';
import { FilterModal, FilterState, initialFilterState } from '../components/home/FilterModal';
import { RestaurantData, normalizeRestaurantData } from '../data/mock-data';
import { useAuthStore } from '../stores/use-auth-store';
import { useAddressStore } from '../stores/use-address-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function CustomerHomePage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();

  // Dynamic Location State
  const [locationLabel, setLocationLabel] = useState<string>('Location');
  const [locationAddress, setLocationAddress] = useState<string>('Please enable location access');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle'|'requesting'|'detected'|'resolving'|'resolved'|'permission-denied'|'unavailable'|'timeout'|'failed'>('idle');

  // Filters & State
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Real Data State with Instant Cache
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 0. Instant Cache Hydration on Mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('zayka_restaurants_cache') || sessionStorage.getItem('zayka_restaurants_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRestaurants(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // 1. Dynamic Location: Sync with useAddressStore (Single Source of Truth)
  const { addresses, selectedAddressId, addAddress, setSelectedAddress } = useAddressStore();
  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    let isMounted = true;

    // A. If address already exists in store, use it immediately
    if (selectedAddress) {
      const label = selectedAddress.placeName || selectedAddress.addressLine1 || selectedAddress.label || 'Current Location';
      const detail = [selectedAddress.addressLine1, selectedAddress.city, selectedAddress.state].filter(Boolean).join(', ') || selectedAddress.city || 'Location detected';
      setLocationLabel(label);
      setLocationAddress(detail);
      setLocationStatus('resolved');
      if (selectedAddress.latitude && selectedAddress.longitude) {
        const coords = { lat: Number(selectedAddress.latitude), lng: Number(selectedAddress.longitude) };
        setUserCoords(coords);
        fetchRestaurants(coords);
      }
      return;
    }

    // B. If user is authenticated, check saved addresses from backend
    const loadSavedOrGpsLocation = async () => {
      if (isAuthenticated && accessToken) {
        try {
          const res = await fetch(`${API_BASE}/addresses`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.addresses ?? [];
            const defaultAddr = list.find((a: any) => a.isDefault) || list[0];

            if (defaultAddr && isMounted) {
              const locality = defaultAddr.placeName || defaultAddr.addressLine1 || defaultAddr.addressLabel || 'Saved Address';
              const detail = [defaultAddr.addressLine1, defaultAddr.city, defaultAddr.state].filter(Boolean).join(', ');
              setLocationLabel(locality);
              setLocationAddress(detail);
              if (defaultAddr.latitude && defaultAddr.longitude) {
                const coords = { lat: Number(defaultAddr.latitude), lng: Number(defaultAddr.longitude) };
                setUserCoords(coords);
                setLocationStatus('resolved');
                addAddress({
                  id: defaultAddr.id || 'saved-default',
                  label: defaultAddr.addressLabel || 'Saved Address',
                  addressLine1: defaultAddr.addressLine1,
                  city: defaultAddr.city,
                  state: defaultAddr.state,
                  postalCode: defaultAddr.postalCode,
                  latitude: coords.lat,
                  longitude: coords.lng,
                  locationSource: 'SAVED_ADDRESS',
                  verificationStatus: 'VERIFIED',
                  isDefault: true,
                });
                fetchRestaurants(coords);
                return;
              }
            }
          }
        } catch {
          // fallback to GPS
        }
      }

      // C. Request browser GPS with finite timeout and error handling
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        if (isMounted) {
          setLocationStatus('requesting');
          setLocationLabel('Detecting location...');
          setLocationAddress('Please allow GPS access');
        }

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (!isMounted) return;

            const coords = { lat, lng };
            setUserCoords(coords);
            setLocationStatus('resolving');

            try {
              const geoRes = await fetch(`${API_BASE}/geolocation/reverse-geocode?lat=${lat}&lng=${lng}`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && isMounted) {
                  const locality = (geoData.locality || geoData.village || geoData.subLocality || '').trim();
                  const subDistrict = (geoData.subDistrict || '').trim();
                  const district = (geoData.district || geoData.city || '').trim();
                  const state = (geoData.state || 'Jammu & Kashmir').trim();
                  const pincode = (geoData.pincode || geoData.postalCode || '').trim();

                  const specificName = locality || subDistrict || district || 'Current Location';
                  const cleanAddress = geoData.formattedAddress || [locality, subDistrict, district, state].filter(Boolean).join(', ');
                  const addressLine2 = [subDistrict, district].filter(Boolean).filter(d => d !== specificName).join(', ');

                  setLocationLabel(specificName);
                  setLocationAddress(cleanAddress);
                  setLocationStatus('resolved');

                  // Save into authoritative address store
                  addAddress({
                    id: 'current-location',
                    label: 'Current Location',
                    placeName: specificName,
                    addressLine1: specificName,
                    addressLine2: addressLine2 || undefined,
                    city: district || 'Jammu & Kashmir',
                    state: state,
                    postalCode: pincode,
                    latitude: lat,
                    longitude: lng,
                    locationSource: 'CURRENT_GPS',
                    verificationStatus: 'VERIFIED',
                    isDefault: false,
                  });
                  setSelectedAddress('current-location');
                  fetchRestaurants(coords);
                  return;
                }
              }
            } catch {
              // fallback
            }

            if (isMounted) {
              setLocationLabel('Current Location');
              setLocationAddress('Location verified via GPS');
              setLocationStatus('resolved');
              fetchRestaurants(coords);
            }
          },
          (err) => {
            if (!isMounted) return;
            setLocationLabel('Location');
            if (err.code === err.PERMISSION_DENIED) {
              setLocationAddress('Tap to set delivery location');
              setLocationStatus('permission-denied');
            } else if (err.code === err.TIMEOUT) {
              setLocationAddress('GPS timed out — Tap to select location');
              setLocationStatus('timeout');
            } else {
              setLocationAddress('Tap to select delivery location');
              setLocationStatus('failed');
            }
            fetchRestaurants();
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
        );
      } else {
        if (isMounted) {
          setLocationLabel('Location');
          setLocationAddress('Tap to select delivery location');
          setLocationStatus('unavailable');
          fetchRestaurants();
        }
      }
    };

    loadSavedOrGpsLocation();
    return () => { isMounted = false; };
  }, [selectedAddressId, isAuthenticated, accessToken]);

  // 2. Fetch Restaurants from Backend API (Passing customer coordinates for backend distance calculation)
  const fetchRestaurants = async (coords = userCoords) => {
    // Only show full loading spinner if we don't already have cached items
    if (restaurants.length === 0) {
      setIsLoading(true);
    }
    setIsError(false);
    try {
      const url = coords
        ? `${API_BASE}/restaurants?lat=${coords.lat}&lng=${coords.lng}`
        : `${API_BASE}/restaurants`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.restaurants ?? [];
        const normalized = list.map((r: any) => normalizeRestaurantData(r, coords));
        setRestaurants(normalized);
        try {
          localStorage.setItem('zayka_restaurants_cache', JSON.stringify(normalized));
          sessionStorage.setItem('zayka_restaurants_cache', JSON.stringify(normalized));
        } catch {
          // ignore quota
        }
      } else if (restaurants.length === 0) {
        setIsError(true);
      }
    } catch (err) {
      console.error('Failed to load restaurants from backend', err);
      if (restaurants.length === 0) {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(userCoords);
    const interval = setInterval(() => fetchRestaurants(userCoords), 30000);
    return () => clearInterval(interval);
  }, [userCoords]);

  // 3. Fetch Customer Favorites from Backend
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setFavorites([]);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/favorites/restaurants`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(Array.isArray(data) ? data : []);
        }
      } catch {
        // guest or offline
      }
    };

    fetchFavorites();
  }, [isAuthenticated, accessToken]);

  // 4. Fetch Active Order for Live Tracking
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const fetchActiveOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/active`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setActiveOrder(res.ok ? await res.json() : null);
      } catch {
        // no active order
      }
    };
    fetchActiveOrder();
  }, [isAuthenticated, accessToken]);

  // Voice Search / Mic Trigger
  const handleMicSearch = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = 'en-IN';
        recognition.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          if (transcript) {
            router.push(`/search?q=${encodeURIComponent(transcript)}`);
          }
        };
        recognition.start();
      } catch {
        router.push('/search');
      }
    } else {
      router.push('/search');
    }
  };

  // Dynamic Multi-Filtering & Sorting
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];

    // 1. Search Query Filter (matches restaurant name, cuisines, and food items)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.cuisines || []).some((c) => c.toLowerCase().includes(q)) ||
          (r.foodItems || []).some((f) => f.name.toLowerCase().includes(q)),
      );
    }

    // 2. Category Carousel Filter
    if (selectedCategory.trim() && selectedCategory.toLowerCase() !== 'all') {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(
        (r) =>
          (r.cuisines || []).some((c) => c.toLowerCase().includes(cat)) ||
          r.name.toLowerCase().includes(cat) ||
          (r.foodItems || []).some(
            (f) =>
              (f.category || '').toLowerCase().includes(cat) ||
              f.name.toLowerCase().includes(cat),
          ),
      );
    }

    // 3. Header Veg-Only Toggle
    if (isVegOnly) {
      list = list.filter((r) =>
        r.foodItems && r.foodItems.length > 0
          ? r.foodItems.some((f) => f.isVeg)
          : true,
      );
    }

    // 4. Multi-Filter: Under 30 mins
    if (filters.under30Mins) {
      list = list.filter((r) => (r.deliveryTimeMins || 99) <= 30);
    }

    // 5. Multi-Filter: Rating 4.0+
    if (filters.rating4Plus) {
      list = list.filter((r) => (r.avgRating || 0) >= 4.0);
    }

    // 6. Multi-Filter: Pure Veg
    if (filters.pureVeg) {
      list = list.filter((r) =>
        r.foodItems && r.foodItems.length > 0
          ? r.foodItems.every((f) => f.isVeg)
          : (r.cuisines || []).some((c) => c.toLowerCase().includes('veg')),
      );
    }

    // 7. Multi-Filter: Near Me (within 10 km)
    if (filters.nearMe) {
      list = list.filter((r) => (r.distanceKm !== undefined ? r.distanceKm <= 10 : true));
    }

    // 8. Multi-Filter: Active Offers & Discounts
    if (filters.hasOffers) {
      list = list.filter((r) =>
        Boolean(
          r.discountBadge ||
            (r.foodItems && r.foodItems.some((f) => f.originalPrice && f.originalPrice > f.price)),
        ),
      );
    }

    // 9. Sorting
    if (filters.sortBy === 'rating') {
      list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (filters.sortBy === 'deliveryTime') {
      list.sort((a, b) => (a.deliveryTimeMins ?? Infinity) - (b.deliveryTimeMins ?? Infinity));
    } else if (filters.sortBy === 'distance' || filters.nearMe) {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return list;
  }, [restaurants, searchQuery, selectedCategory, isVegOnly, filters]);

  const activeFiltersCount = useMemo(() => {
    return [
      filters.under30Mins,
      filters.rating4Plus,
      filters.pureVeg,
      filters.nearMe,
      filters.hasOffers,
      filters.sortBy !== 'relevance',
    ].filter(Boolean).length;
  }, [filters]);

  const hasAnyFilterActive =
    activeFiltersCount > 0 ||
    isVegOnly ||
    Boolean(selectedCategory && selectedCategory.toLowerCase() !== 'all') ||
    Boolean(searchQuery.trim());

  const handleClearAllFilters = () => {
    setFilters(initialFilterState);
    setIsVegOnly(false);
    setSelectedCategory('');
    setSearchQuery('');
  };

  const recommendedList = filteredRestaurants.slice(0, 6);
  const popularList = filteredRestaurants.slice(6, 12).length > 0
    ? filteredRestaurants.slice(6, 12)
    : filteredRestaurants.slice(0, 4);

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const customerGreeting = user?.firstName ? `Hi, ${user.firstName}` : 'Zayka Food';
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8 md:space-y-12 pb-10">

        {/* ─── ROW 1: LOGO (LEFT) & NAME (CENTER/RIGHT) (Mobile Only) ───── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100/80 pb-2 md:hidden">
          {/* Logo on Left */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/zaykafood-logo.png"
              alt="Zayka Food"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </Link>

          {/* Name / Brand / Greeting in Center-Right */}
          <div className="text-right shrink-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900">
              {customerGreeting}
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider">
              Order • Deliver • Enjoy
            </p>
          </div>
        </div>

        {/* ─── ROW 2: LOCATION (LEFT) + VEG TOGGLE + NOTIFICATION + PROFILE (RIGHT) ─── */}
        <div className="flex items-center justify-between gap-3 pt-2 pb-1">
          {/* Current Location on Left */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-start gap-2 min-w-0 flex-1 group text-left"
          >
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 shrink-0 group-hover:bg-rose-100 transition">
              <MapPin className="h-4 w-4 fill-rose-600 text-rose-600" />
            </div>
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base font-black text-gray-900 tracking-tight truncate">{locationLabel}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate font-medium mt-0.5">
                {locationAddress}
              </p>
            </div>
          </button>

          {/* Right Action Cluster: Veg Toggle + Notification + Profile Photo */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Veg Toggle Button */}
            <button
              type="button"
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-black shadow-sm ${
                isVegOnly
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Toggle Pure Veg mode"
            >
              <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                isVegOnly ? 'border-emerald-600 bg-emerald-600' : 'border-gray-400 bg-white'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${isVegOnly ? 'bg-white' : 'bg-gray-400'}`} />
              </div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-tight hidden xs:inline-block">
                {isVegOnly ? 'Pure Veg' : 'Veg Only'}
              </span>
            </button>

            {/* Notification & Profile (Mobile Only, Desktop handled by Navbar) */}
            <div className="flex items-center gap-2.5 md:hidden">
              <Link
                href="/notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition relative border border-gray-100 shrink-0"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </Link>

              <Link
                href={isAuthenticated ? '/profile' : '/login'}
                className="shrink-0"
                aria-label="User Profile"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.firstName || 'Profile'}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-100"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 text-white font-black text-xs shadow-sm">
                    {isAuthenticated ? initials : 'Sign In'}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ─── LIVE ACTIVE ORDER TOAST (IF ACTIVE) ─────────── */}
        {isAuthenticated && activeOrder && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-600 p-3 text-white shadow-lg shadow-rose-600/20 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse shrink-0" />
              <div className="min-w-0 text-xs">
                <p className="font-black truncate">Live Order #{activeOrder.orderNumber}</p>
                <p className="text-rose-100 truncate text-[11px]">
                  {activeOrder.driverName ? `With ${activeOrder.driverName}` : 'Preparing your meal'}
                  {activeOrder.etaMins ? ` · ~${activeOrder.etaMins} mins` : ''}
                </p>
              </div>
            </div>
            <Link
              href={`/orders/${activeOrder.orderId || activeOrder.id}/track`}
              className="rounded-xl bg-white px-3 py-1 text-xs font-black text-rose-600 hover:bg-rose-50 transition shrink-0 flex items-center gap-1"
            >
              Track <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ─── ROW 3: LARGE ROUNDED SEARCH BAR (Mobile Only) ─────────────── */}
        <div className="relative w-full md:hidden pt-1">
          <div className="relative flex items-center rounded-full border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-rose-400 transition-all duration-200 shadow-sm">
            <div className="pl-4 pr-2 text-rose-600">
              <Search className="h-5 w-5 stroke-[2.5]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Search restaurants, dishes and cuisines..."
              className="w-full bg-transparent py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleMicSearch}
              className="p-3 pr-4 text-rose-600 hover:text-rose-700 transition"
              aria-label="Voice Search"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── ROW 4: DYNAMIC FOOD CATEGORIES (ALL, Bir, Piz, Bur, ...) ─── */}
        <CategoryCarousel
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* ─── ROW 5: FILTER CHIPS (Filters, Under 30 mins, Ratings 4.0+, Pure Veg, Near Me, Offers) ─── */}
        <div className="flex flex-nowrap gap-2.5 overflow-x-auto pb-2 pt-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" style={{ overscrollBehaviorX: 'contain' }}>
          {/* Main Filters Button (Opens Modal) */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${
              activeFiltersCount > 0
                ? 'border-rose-600 bg-rose-50 text-rose-700 font-black shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-rose-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Under 30 mins Chip */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, under30Mins: !prev.under30Mins }))}
            className={`flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${
              filters.under30Mins
                ? 'border-rose-600 bg-rose-600 text-white font-black shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Under 30 mins
          </button>

          {/* Ratings 4.0+ Chip */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, rating4Plus: !prev.rating4Plus }))}
            className={`flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${
              filters.rating4Plus
                ? 'border-rose-600 bg-rose-600 text-white font-black shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ratings 4.0+
          </button>

          {/* Pure Veg Chip */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, pureVeg: !prev.pureVeg }))}
            className={`flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${
              filters.pureVeg
                ? 'border-emerald-600 bg-emerald-600 text-white font-black shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pure Veg
          </button>

          {/* Near Me Chip */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, nearMe: !prev.nearMe }))}
            className={`flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${
              filters.nearMe
                ? 'border-rose-600 bg-rose-600 text-white font-black shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Near Me
          </button>

          {/* Active Offers Chip */}
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, hasOffers: !prev.hasOffers }))}
            className={`flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border px-[14px] text-xs font-bold whitespace-nowrap transition-all ${
              filters.hasOffers
                ? 'border-rose-600 bg-rose-600 text-white font-black shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Offers
          </button>

          {/* Clear Filters Reset Chip */}
          {hasAnyFilterActive && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="flex-shrink-0 flex items-center justify-center h-[38px] rounded-full border border-rose-200 bg-rose-50 px-[14px] text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all whitespace-nowrap"
            >
              Clear Filters ✕
            </button>
          )}
        </div>

        {/* ─── ROW 6: RECOMMENDED FOR YOU (DYNAMIC) ────────── */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-600">
              RECOMMENDED FOR YOU
            </h2>
            {!isLoading && (
              <span className="text-[11px] font-bold text-gray-400">
                {recommendedList.length} kitchens
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-center space-y-2">
              <p className="text-xs sm:text-sm font-bold text-rose-800">Unable to load kitchens at this time.</p>
              <button
                onClick={() => fetchRestaurants(userCoords)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : recommendedList.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {recommendedList.map((restaurant) => (
                <RecommendedCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isInitiallyFavorite={favorites.includes(restaurant.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-center space-y-2">
              <p className="text-xs sm:text-sm font-bold text-gray-700">No restaurants match your selected filters.</p>
              <p className="text-[11px] text-gray-400">Try broadening your criteria or reset all filters.</p>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-block mt-1 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* ─── ROW 7: POPULAR NEAR YOU (DYNAMIC) ───────────── */}
        <section className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-600">
              POPULAR NEAR YOU
            </h2>
            <Link
              href="/restaurants"
              className="flex items-center gap-1 text-xs font-black text-rose-600 hover:text-rose-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : popularList.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {popularList.map((restaurant) => (
                <RecommendedCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isInitiallyFavorite={favorites.includes(restaurant.id)}
                />
              ))}
            </div>
          ) : null}
        </section>

      </div>

      {/* Location Selection Modal (GPS / Search / Saved) */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocality={locationLabel}
        currentAddress={locationAddress}
        onSelectLocation={(loc) => {
          setLocationLabel(loc.label || loc.locality || 'Selected Location');
          setLocationAddress(loc.address);
          setUserCoords({ lat: loc.lat, lng: loc.lng });
        }}
      />

      {/* Filter & Sort Bottom Sheet / Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={() => setFilters(initialFilterState)}
        matchingCount={filteredRestaurants.length}
      />
    </div>
  );
}
