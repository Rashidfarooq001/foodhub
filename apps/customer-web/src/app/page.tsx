'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  ChevronDown,
  Bell,
  Search,
  Mic,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { CategoryCarousel } from '../components/home/CategoryCarousel';
import { RecommendedCard } from '../components/home/RecommendedCard';
import { HeroBanner } from '../components/home/HeroBanner';
import { RestaurantData, normalizeRestaurantData } from '../data/mock-data';
import { useAuthStore } from '../stores/use-auth-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function CustomerHomePage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();

  // Dynamic Location State
  const [locationLabel, setLocationLabel] = useState<string>('Home');
  const [locationAddress, setLocationAddress] = useState<string>('Detecting location...');

  // Filters & State
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<'all' | 'fast' | 'rating' | 'veg' | 'offers' | 'near'>('all');

  // Real Data State
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Dynamic Location: Fetch Authenticated Saved Default Address OR Reverse Geocode Browser Coords
  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      // If customer is authenticated, check their saved default delivery address
      if (isAuthenticated && accessToken) {
        try {
          const res = await fetch(`${API_BASE}/addresses`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const addresses = await res.json();
            const list = Array.isArray(addresses) ? addresses : addresses.addresses ?? [];
            const defaultAddr = list.find((a: any) => a.isDefault) || list[0];

            if (defaultAddr && isMounted) {
              setLocationLabel(defaultAddr.addressLabel || 'Home');
              setLocationAddress([defaultAddr.addressLine1, defaultAddr.city, defaultAddr.postalCode].filter(Boolean).join(', '));
              if (defaultAddr.latitude && defaultAddr.longitude) {
                setUserCoords({ lat: Number(defaultAddr.latitude), lng: Number(defaultAddr.longitude) });
                return;
              }
            }
          }
        } catch {
          // fallback to geolocation
        }
      }

      // Otherwise, request browser geolocation and reverse geocode via backend
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (!isMounted) return;
            setUserCoords({ lat, lng });

            try {
              const geoRes = await fetch(`${API_BASE}/geolocation/reverse?lat=${lat}&lng=${lng}`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.address && isMounted) {
                  setLocationLabel('Current Location');
                  setLocationAddress(geoData.address);
                  return;
                }
              }
            } catch {
              // fallback
            }

            if (isMounted) {
              setLocationLabel('Current Location');
              setLocationAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          },
          () => {
            if (isMounted) {
              setLocationLabel('Select Location');
              setLocationAddress('Tap to set delivery address');
            }
          },
          { timeout: 6000 },
        );
      } else {
        if (isMounted) {
          setLocationLabel('Select Location');
          setLocationAddress('Tap to set delivery address');
        }
      }
    };

    loadLocation();
    return () => { isMounted = false; };
  }, [isAuthenticated, accessToken]);

  // 2. Fetch Restaurants from Backend API
  const fetchRestaurants = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch(`${API_BASE}/restaurants`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.restaurants ?? [];
        setRestaurants(list.map((r: any) => normalizeRestaurantData(r, userCoords)));
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Failed to load restaurants from backend', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    const interval = setInterval(fetchRestaurants, 30000);
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

  // Dynamic Filtering
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.cuisines || []).some((c) => c.toLowerCase().includes(q)),
      );
    }

    // Category filter
    if (selectedCategory.trim()) {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(
        (r) =>
          (r.cuisines || []).some((c) => c.toLowerCase().includes(cat)) ||
          r.name.toLowerCase().includes(cat),
      );
    }

    // Veg Only toggle
    if (isVegOnly || activeChip === 'veg') {
      list = list.filter((r) =>
        r.foodItems && r.foodItems.length > 0
          ? r.foodItems.some((f) => f.isVeg)
          : true,
      );
    }

    // Filter Chips
    if (activeChip === 'fast') {
      list = list.filter((r) => (r.deliveryTimeMins || 99) <= 30);
    } else if (activeChip === 'rating') {
      list = list.filter((r) => (r.avgRating || 0) >= 4.0);
    } else if (activeChip === 'offers') {
      list = list.filter((r) => Boolean(r.discountBadge));
    } else if (activeChip === 'near') {
      list.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
    }

    return list;
  }, [restaurants, searchQuery, selectedCategory, isVegOnly, activeChip]);

  const recommendedList = filteredRestaurants.slice(0, 6);
  const popularList = filteredRestaurants.slice(6, 12).length > 0
    ? filteredRestaurants.slice(6, 12)
    : filteredRestaurants.slice(0, 4);

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const customerGreeting = user?.firstName ? `Hi, ${user.firstName}` : 'Zayka Food';

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 space-y-4 sm:space-y-5">

        {/* ─── ROW 1: LOGO (LEFT) & NAME (CENTER) ──────────── */}
        <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
          {/* Logo on Left */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/zaykafood-logo.png"
              alt="ZaykaFood"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Name / Brand / Greeting in Center-Right */}
          <div className="text-right sm:text-center">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900">
              {customerGreeting}
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider">
              Order • Deliver • Enjoy
            </p>
          </div>
        </div>

        {/* ─── ROW 2: LOCATION (LEFT) + VEG BUTTON + NOTIFICATION + PROFILE (RIGHT) ─── */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Current Location on Left */}
          <Link
            href={isAuthenticated ? '/addresses' : '/login'}
            className="flex items-start gap-1.5 min-w-0 max-w-[55%] sm:max-w-md group"
          >
            <div className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 shrink-0 group-hover:bg-rose-100 transition">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-rose-600 text-rose-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-black text-gray-900 tracking-tight">{locationLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500 stroke-[2.5]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate font-medium">
                {locationAddress}
              </p>
            </div>
          </Link>

          {/* Right Action Cluster: Veg-Nonveg Button + Notification + Profile Photo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Veg - Nonveg Button */}
            <button
              type="button"
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all text-xs font-black shadow-sm ${
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
              <span className="text-[10px] sm:text-[11px] uppercase tracking-tight">
                {isVegOnly ? 'Pure Veg' : 'Veg Only'}
              </span>
            </button>

            {/* Notification Icon */}
            <Link
              href="/notifications"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition relative border border-gray-100"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            {/* Profile Photo */}
            <Link
              href={isAuthenticated ? '/profile' : '/login'}
              className="shrink-0"
              aria-label="User Profile"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName || 'Profile'}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-rose-100"
                />
              ) : (
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 text-white font-black text-xs shadow-sm">
                  {isAuthenticated ? initials : 'Sign In'}
                </div>
              )}
            </Link>
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

        {/* ─── ROW 3: LARGE ROUNDED SEARCH BAR ─────────────── */}
        <div className="relative w-full">
          <div className="relative flex items-center rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-gray-50/80 hover:bg-white hover:border-rose-400 transition-all duration-200 shadow-sm">
            <div className="pl-4 pr-2 text-rose-600">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
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
              placeholder="Search restaurants, dishes and cuisines"
              className="w-full bg-transparent py-2.5 sm:py-3.5 text-xs sm:text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleMicSearch}
              className="p-2.5 pr-4 text-rose-600 hover:text-rose-700 transition"
              aria-label="Voice Search"
            >
              <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* ─── ROW 4: DYNAMIC FOOD CATEGORIES (ALL, Bir, Piz, Bur, ...) ─── */}
        <CategoryCarousel
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* ─── ROW 5: FILTER CHIPS (Filter, Under 30, Rating, etc.) ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveChip(activeChip === 'all' ? 'rating' : 'all')}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip !== 'all'
                ? 'border-rose-600 bg-rose-50 text-rose-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'fast' ? 'all' : 'fast')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'fast'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Under 30 mins
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'rating' ? 'all' : 'rating')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'rating'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ratings 4.0+
          </button>

          <button
            onClick={() => {
              setIsVegOnly(!isVegOnly);
              setActiveChip(isVegOnly ? 'all' : 'veg');
            }}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              isVegOnly || activeChip === 'veg'
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pure Veg
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'offers' ? 'all' : 'offers')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'offers'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Offers
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'near' ? 'all' : 'near')}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'near'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Near Me
          </button>
        </div>

        {/* ─── PROMOTIONAL OFFERS BANNER (DYNAMIC FROM DB) ─── */}
        <HeroBanner />

        {/* ─── ROW 6: RECOMMENDED FOR YOU ──────────────────── */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-600">
              Recommended For You
            </h2>
            {!isLoading && (
              <span className="text-[11px] font-bold text-gray-400">
                {recommendedList.length} verified kitchens
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-6 text-center space-y-2">
              <p className="text-xs sm:text-sm font-bold text-rose-800">Unable to load kitchens at this time.</p>
              <button
                onClick={fetchRestaurants}
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
            <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6 text-center">
              <p className="text-xs sm:text-sm font-bold text-gray-700">No restaurants match your selected filters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setActiveChip('all');
                  setIsVegOnly(false);
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-bold text-rose-600 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </section>

        {/* ─── ROW 7: POPULAR (DYNAMIC) ────────────────────── */}
        <section className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-600">
              Popular
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
                <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />
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
    </div>
  );
}
