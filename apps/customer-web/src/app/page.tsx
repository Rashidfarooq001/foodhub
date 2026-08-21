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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
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
  const { user, isAuthenticated } = useAuthStore();

  // Location & Filters
  const [deliveryLocation, setDeliveryLocation] = useState('Kehnusa, Bandipora, J&K 193502');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<'all' | 'fast' | 'rating' | 'veg' | 'offers' | 'near'>('all');

  // Real Data State
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Geolocation lookup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Defaults to Bandipora
        },
        { timeout: 5000 },
      );
    }
  }, []);

  // Fetch real restaurants from backend
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.restaurants ?? [];
          setRestaurants(list.map((r: any) => normalizeRestaurantData(r, userCoords)));
        }
      } catch (err) {
        console.error('Failed to load restaurants', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
    const interval = setInterval(fetchRestaurants, 30000);
    return () => clearInterval(interval);
  }, [userCoords]);

  // Fetch active order for authenticated user
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchActiveOrder = async () => {
      try {
        const { accessToken } = useAuthStore.getState();
        const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await fetch(`${API_BASE}/orders/active`, { headers });
        setActiveOrder(res.ok ? await res.json() : null);
      } catch {
        // no active order
      }
    };
    fetchActiveOrder();
  }, [isAuthenticated]);

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

  // Filtered & Sorted Restaurants
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
        r.foodItems ? r.foodItems.some((f) => f.isVeg) : true,
      );
    }

    // Filter Chips
    if (activeChip === 'fast') {
      list = list.filter((r) => (r.deliveryTimeMins || 30) <= 30);
    } else if (activeChip === 'rating') {
      list = list.filter((r) => (r.avgRating || 0) >= 4.0);
    } else if (activeChip === 'offers') {
      list = list.filter((r) => Boolean(r.discountBadge));
    }

    return list;
  }, [restaurants, searchQuery, selectedCategory, isVegOnly, activeChip]);

  // Recommended vs Popular split
  const recommendedList = filteredRestaurants.slice(0, 6);
  const popularList = filteredRestaurants.slice(6, 12).length > 0 ? filteredRestaurants.slice(6, 12) : filteredRestaurants.slice(0, 4);

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'Z';

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-12">
      {/* Container with mobile-first and centered responsive desktop layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 space-y-4 sm:space-y-6">

        {/* ─── 1. TOP LOCATION & PROFILE BAR ───────────────── */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Location details */}
          <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 shrink-0">
              <MapPin className="h-4 w-4 fill-rose-600 text-rose-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-base font-black text-gray-900 tracking-tight">Home</span>
                <ChevronDown className="h-4 w-4 text-gray-600 stroke-[2.5]" />
              </div>
              <p className="text-xs text-gray-500 truncate font-medium max-w-[200px] sm:max-w-md">
                {deliveryLocation}
              </p>
            </div>
          </div>

          {/* Right Header Actions: Veg Toggle, Bell, Profile Avatar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* VEG Toggle */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-0.5">VEG</span>
              <button
                type="button"
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isVegOnly ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={isVegOnly}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isVegOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-600" />
            </Link>

            {/* User Profile Avatar */}
            <Link href={isAuthenticated ? '/profile' : '/login'} className="shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName || 'Profile'}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-rose-100"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black text-xs shadow-sm">
                  {initials}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* ─── ACTIVE ORDER TRACKING TOAST (IF PRESENT) ─────── */}
        {isAuthenticated && activeOrder && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-600 p-3.5 text-white shadow-lg shadow-rose-600/20 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock className="h-5 w-5 animate-pulse shrink-0" />
              <div className="min-w-0 text-xs">
                <p className="font-black truncate">Live Order #{activeOrder.orderNumber}</p>
                <p className="text-rose-100 truncate">Out for delivery · ~{activeOrder.etaMins || 20} mins</p>
              </div>
            </div>
            <Link
              href={`/orders/${activeOrder.orderId}/track`}
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-50 transition shrink-0 flex items-center gap-1"
            >
              Track <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ─── 2. LARGE ROUNDED SEARCH BAR ─────────────────── */}
        <div className="relative w-full">
          <div className="relative flex items-center rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-gray-50/70 hover:bg-white hover:border-rose-300 transition-all duration-200 shadow-sm">
            <div className="pl-4 pr-2 text-rose-600">
              <Search className="h-5 w-5 stroke-[2.5]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              placeholder="Search restaurants, dishes and cuisines"
              className="w-full bg-transparent py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
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

        {/* ─── 3. HORIZONTAL FOOD CATEGORY CAROUSEL ─────────── */}
        <CategoryCarousel
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* ─── 4. HORIZONTAL FILTER CHIPS ──────────────────── */}
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
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'fast'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Under 30 mins
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'rating' ? 'all' : 'rating')}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
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
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              isVegOnly || activeChip === 'veg'
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pure Veg
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'offers' ? 'all' : 'offers')}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'offers'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Offers
          </button>

          <button
            onClick={() => setActiveChip(activeChip === 'near' ? 'all' : 'near')}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeChip === 'near'
                ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Near Me
          </button>
        </div>

        {/* ─── HERO PROMO OFFERS CAROUSEL ──────────────────── */}
        <HeroBanner />

        {/* ─── 5. RECOMMENDED FOR YOU SECTION ──────────────── */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-500">
              Recommended For You
            </h2>
            <span className="text-[11px] font-bold text-gray-400">
              {recommendedList.length} top picks
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-3xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : recommendedList.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {recommendedList.map((restaurant, idx) => (
                <RecommendedCard
                  key={restaurant.id || idx}
                  restaurant={restaurant}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-8 text-center">
              <p className="text-sm font-bold text-gray-700">No restaurants match your selected filters.</p>
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

        {/* ─── 6. POPULAR NEAR YOU SECTION ─────────────────── */}
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-500">
              Popular Near You
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
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {popularList.map((restaurant, idx) => (
                <RecommendedCard
                  key={restaurant.id || idx}
                  restaurant={restaurant}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
