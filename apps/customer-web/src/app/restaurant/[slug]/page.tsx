'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { RestaurantData, FoodItemData, normalizeRestaurantData } from '../../../data/mock-data';
import { FoodCard } from '../../../components/food/FoodCard';
import {
  Star, Clock, MapPin, Search, X, ArrowLeft,
  UtensilsCrossed, ShoppingBag, ArrowRight, Plus, Minus,
  ShieldCheck,
} from 'lucide-react';
import { useCartStore } from '../../../stores/use-cart-store';
import Link from 'next/link';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();


export default function RestaurantDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItemData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [customizationQty, setCustomizationQty] = useState(1);

  const { addItem, getItemCount, getGrandTotal } = useCartStore();
  const cartItemCount = getItemCount();
  const cartGrandTotal = getGrandTotal();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/${slug}`);
        if (res.status === 404) { setNotFound(true); setIsLoading(false); return; }
        if (res.ok) {
          const data = await res.json();
          if (data?.status && data.status !== 'APPROVED') { setNotFound(true); setIsLoading(false); return; }
          setRestaurant(normalizeRestaurantData(data));
          if (data?.id) {
            try {
              const revRes = await fetch(`${API_BASE}/reviews/restaurant/${data.id}`);
              if (revRes.ok) { const rv = await revRes.json(); setReviewsList(rv.reviews || []); }
            } catch { /* ignore */ }
          }
        } else { setNotFound(true); }
      } catch { setNotFound(true); }
      finally { setIsLoading(false); }
    };
    fetchRestaurant();
    const t = setInterval(fetchRestaurant, 12000);
    return () => clearInterval(t);
  }, [slug]);

  const categoriesList = useMemo(() => {
    if (!restaurant?.foodItems) return ['All'];
    const s = new Set<string>();
    restaurant.foodItems.forEach((f) => { if (f.category) s.add(f.category); });
    return ['All', ...Array.from(s)];
  }, [restaurant]);

  const filteredItems = useMemo(() => {
    if (!restaurant?.foodItems) return [];
    return restaurant.foodItems.filter((f) => {
      const mSearch = !menuSearch.trim() || f.name.toLowerCase().includes(menuSearch.toLowerCase()) || (f.description || '').toLowerCase().includes(menuSearch.toLowerCase());
      const mCat = selectedCategory === 'All' || (f.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const mVeg = !isVegOnly || f.isVeg;
      return mSearch && mCat && mVeg;
    });
  }, [restaurant, menuSearch, selectedCategory, isVegOnly]);

  const openCustomization = (food: FoodItemData) => {
    setSelectedFood(food);
    const avail = (food.variants || []).filter((v) => v.isAvailable !== false);
    setSelectedVariant(avail.length > 0 ? avail[0] : null);
    setSelectedAddons([]);
    setCustomizationQty(1);
  };

  const handleToggleAddon = (addon: any) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  const handleAddCustomizedToCart = () => {
    if (!selectedFood) return;
    const price = selectedVariant ? selectedVariant.price : selectedFood.price;
    addItem({
      foodItemId: selectedFood.id,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.variantName,
      name: selectedFood.name,
      price,
      imageUrl: selectedFood.imageUrl,
      isVeg: selectedFood.isVeg,
      restaurantId: selectedFood.restaurantId,
      restaurantName: selectedFood.restaurantName,
      addons: selectedAddons,
    }, customizationQty);
    setSelectedFood(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 pb-24">
        <div className="h-14 bg-white border-b border-gray-100" />
        <div className="mx-auto max-w-4xl px-3 py-3 space-y-4">
          <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (<div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-200" />
          <p className="text-xl font-black text-gray-900">Restaurant Not Found</p>
          <p className="text-xs text-gray-500">This kitchen is unavailable or doesn&apos;t exist.</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 pb-8">
      {/* RESTAURANT SUB-BAR */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-black text-gray-900 truncate">{restaurant.name}</h1>
            <p className="text-[11px] text-gray-500 truncate">{restaurant.cuisines?.join(' • ') || 'Multi-Cuisine Kitchen'}</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-3 space-y-3">
        {/* COMPACT BANNER */}
        <section className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="relative h-28 sm:h-36 w-full bg-gray-900 overflow-hidden">
            <img
              src={getImageUrl(restaurant.bannerUrl || restaurant.logoUrl)}
              alt={restaurant.name}
              className="h-full w-full object-cover opacity-60"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
              <div>
                <span className="inline-block rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">OPEN NOW</span>
                <h2 className="text-base sm:text-xl font-black leading-tight mt-1 truncate">{restaurant.name}</h2>
                <p className="text-[11px] text-gray-300 mt-0.5">{restaurant.cuisines?.join(' • ')}</p>
              </div>
              {restaurant.avgRating && restaurant.avgRating > 0 ? (
                <div className="flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-md px-2 py-1 text-xs font-black text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-300" />
                  <span>{restaurant.avgRating}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 text-[11px] text-gray-600 bg-gray-50/70 border-t border-gray-100">
            <div className="flex items-center gap-1 truncate max-w-[60%]">
              <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
              <span className="truncate">{restaurant.address || 'Bandipora, J&K'}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-semibold">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span>{restaurant.deliveryTimeMins ? restaurant.deliveryTimeMins + ' mins' : '30 mins'}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span>{restaurant.deliveryRadius || 15} km radius</span>
            </div>
          </div>
          {restaurant.fssaiLicense && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>FSSAI License: {restaurant.fssaiLicense}</span>
            </div>
          )}
        </section>

        {/* MENU SEARCH BAR */}
        <section className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search food / menu items..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none shadow-sm transition"
          />
          {menuSearch && (
            <button onClick={() => setMenuSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </section>

        {/* CATEGORY NAVIGATION */}
        <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
          <button
            type="button"
            onClick={() => setIsVegOnly(!isVegOnly)}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-black border transition ${isVegOnly ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <span className={`h-2 w-2 rounded-full ${isVegOnly ? 'bg-emerald-600 ring-1 ring-emerald-600' : 'bg-gray-400'}`} />
            Veg Only
          </button>
          {categoriesList.map((cat) => {
            const active = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${active ? 'bg-rose-600 text-white font-black shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                {cat}
              </button>
            );
          })}
        </section>

        {/* â”€â”€ TWO-COLUMN FOOD GRID â€” WIREFRAME PRIMARY REQUIREMENT â”€â”€ */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
              {selectedCategory === 'All' ? 'Full Menu' : selectedCategory} ({filteredItems.length})
            </h3>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center space-y-2 shadow-sm">
              <UtensilsCrossed className="mx-auto h-8 w-8 text-gray-300" />
              <p className="text-xs font-bold text-gray-800">No matching items</p>
              <p className="text-[11px] text-gray-400">Try a different search or reset filters.</p>
              {(menuSearch || selectedCategory !== 'All' || isVegOnly) && (
                <button onClick={() => { setMenuSearch(''); setSelectedCategory('All'); setIsVegOnly(false); }} className="text-xs font-bold text-rose-600 underline">
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredItems.map((food) => (
                <FoodCard key={food.id} food={food} onCustomize={(f) => openCustomization(f)} />
              ))}
            </div>
          )}
        </section>

        {/* CUSTOMER REVIEWS */}
        {reviewsList.length > 0 && (
          <section className="rounded-2xl bg-white border border-gray-100 p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">Reviews ({reviewsList.length})</h4>
              {restaurant.avgRating && (
                <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{restaurant.avgRating} / 5</span>
                </div>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {reviewsList.slice(0, 3).map((rev) => (
                <div key={rev.id} className="pt-2 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{rev.customer?.user?.profile?.firstName || 'Verified Customer'}</span>
                    <div className="flex text-amber-400">
                      {[1,2,3,4,5].map((s) => (<Star key={s} className={`h-3 w-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`} />))}
                    </div>
                  </div>
                  {rev.comment && <p className="text-gray-600">{rev.comment}</p>}
                  <p className="text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* STICKY FLOATING CART BAR */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 z-40 max-w-lg mx-auto">
          <Link href="/cart" className="flex items-center justify-between rounded-2xl bg-rose-600 px-4 py-3 text-white shadow-xl shadow-rose-600/30 hover:bg-rose-700 transition active:scale-[0.99]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 font-black text-xs">{cartItemCount}</div>
              <div>
                <p className="text-xs font-black">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
                <p className="text-[10px] text-rose-100">{restaurant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-black">
              <span>Rs. {cartGrandTotal}</span>
              <span className="rounded-lg bg-white text-rose-600 px-2 py-1 flex items-center gap-1 text-[11px] font-bold">View Cart <ArrowRight className="h-3 w-3" /></span>
            </div>
          </Link>
        </div>
      )}

      {/* CUSTOMIZATION BOTTOM SHEET */}
      {selectedFood && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedFood(null); setSelectedAddons([]); } }}
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900">{selectedFood.name}</h3>
                <p className="text-[11px] text-gray-500">Select portion &amp; customizations</p>
              </div>
              <button onClick={() => { setSelectedFood(null); setSelectedAddons([]); }} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedFood.variants && selectedFood.variants.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-800">Choose Portion</span>
                <div className="space-y-1.5">
                  {selectedFood.variants.map((v) => {
                    const avail = v.isAvailable !== false;
                    const sel = selectedVariant?.id === v.id;
                    return (
                      <button key={v.id} type="button" disabled={!avail} onClick={() => setSelectedVariant(v)}
                        className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${!avail ? 'opacity-40 cursor-not-allowed bg-gray-50' : sel ? 'border-rose-600 bg-rose-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${sel ? 'border-rose-600 bg-rose-600' : 'border-gray-300'}`}>
                            {sel && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-gray-900">{v.variantName}</span>
                          {!avail && <span className="text-[10px] text-rose-500 font-semibold">(unavailable)</span>}
                        </div>
                        <span className="text-xs font-black text-gray-900">Rs. {v.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedFood.addonGroups?.map((group) => (
              <div key={group.id} className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-800">{group.groupName}</span>
                <div className="space-y-1.5">
                  {group.addons.map((addon) => {
                    const checked = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <label key={addon.id} onClick={() => handleToggleAddon(addon)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${checked ? 'border-rose-600 bg-rose-50/40' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-rose-600 focus:ring-rose-500" readOnly />
                          <span className="text-xs font-bold text-gray-800">{addon.name}</span>
                        </div>
                        <span className="text-xs font-black text-rose-600">+Rs. {addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700">Quantity</span>
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1">
                <button type="button" onClick={() => setCustomizationQty((q) => Math.max(1, q - 1))} disabled={customizationQty <= 1} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm disabled:opacity-40 transition">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-5 text-center text-xs font-black text-gray-900">{customizationQty}</span>
                <button type="button" onClick={() => setCustomizationQty((q) => Math.min(20, q + 1))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm transition">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCustomizedToCart}
              disabled={!!(selectedFood.variants && selectedFood.variants.length > 0 && !selectedVariant)}
              className="flex w-full items-center justify-between rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Add to Cart</span>
              <span className="font-black">
                Rs. {((selectedVariant ? selectedVariant.price : selectedFood.price) + selectedAddons.reduce((s, a) => s + a.price, 0)) * customizationQty}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
