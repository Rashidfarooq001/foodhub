'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RestaurantData, FoodItemData, normalizeRestaurantData } from '../../../data/mock-data';
import { FoodCard } from '../../../components/food/FoodCard';
import { Star, Clock, MapPin, Search, ShieldCheck, Tag, X, ArrowLeft, UtensilsCrossed } from 'lucide-react';
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
  const [selectedFoodForCustomization, setSelectedFoodForCustomization] = useState<FoodItemData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_BASE}/restaurants/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
        } else if (res.ok) {
          const data = await res.json();
          if (data && data.status && data.status !== 'APPROVED') {
            setNotFound(true);
            return;
          }
          const normalized = normalizeRestaurantData(data);
          setRestaurant(normalized);

          // Fetch real customer reviews for this restaurant
          if (data?.id) {
            try {
              const revRes = await fetch(`${API_BASE}/reviews/restaurant/${data.id}`);
              if (revRes.ok) {
                const revData = await revRes.json();
                setReviewsList(revData.reviews || []);
              }
            } catch {
              /* ignore reviews fetch error */
            }
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurant();
    const interval = setInterval(fetchRestaurant, 8000);
    return () => clearInterval(interval);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-80 animate-pulse rounded-3xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center space-y-4">
          <p className="text-2xl font-black text-gray-800">Restaurant Not Found</p>
          <p className="text-sm text-gray-400">The restaurant you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredItems = (restaurant.foodItems ?? []).filter((f) =>
    f.name.toLowerCase().includes(menuSearch.toLowerCase()),
  );

  // When opening customization modal, select the first available variant if variants exist
  const openCustomization = (food: FoodItemData) => {
    setSelectedFoodForCustomization(food);
    const availableVars = (food.variants || []).filter((v) => v.isAvailable !== false);
    setSelectedVariant(availableVars.length > 0 ? availableVars[0] : null);
    setSelectedAddons([]);
  };

  const handleToggleAddon = (addon: any) => {
    const exists = selectedAddons.some((a) => a.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddCustomizedToCart = () => {
    if (!selectedFoodForCustomization) return;

    const unitPrice = selectedVariant ? selectedVariant.price : selectedFoodForCustomization.price;

    addItem({
      foodItemId: selectedFoodForCustomization.id,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.variantName,
      name: selectedFoodForCustomization.name,
      price: unitPrice,
      imageUrl: selectedFoodForCustomization.imageUrl,
      isVeg: selectedFoodForCustomization.isVeg,
      restaurantId: selectedFoodForCustomization.restaurantId,
      restaurantName: selectedFoodForCustomization.restaurantName,
      addons: selectedAddons,
    });

    setSelectedFoodForCustomization(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Restaurant Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-2xl">
        <div className="h-64 w-full relative">
          <img
            src={getImageUrl(restaurant.bannerUrl || restaurant.logoUrl)}
            alt={restaurant.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
            }}
            className="h-full w-full object-cover opacity-50"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        </div>

        <div className="relative -mt-20 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  OPEN NOW
                </span>
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">{restaurant.name}</h1>
              <p className="text-xs text-gray-300">{restaurant.cuisines?.join(' • ')}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" /> {restaurant.address}
              </p>
            </div>

            {/* Rating Box */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10">
              <div>
                {restaurant.avgRating && restaurant.avgRating > 0 ? (
                  <>
                    <div className="flex items-center gap-1 text-base font-black text-amber-400">
                      <Star className="h-5 w-5 fill-amber-400" />
                      <span>{restaurant.avgRating}</span>
                    </div>
                    <p className="text-[10px] text-gray-300">{restaurant.ratingCount || 0} reviews</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-300">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span>No reviews yet</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Be the first to review!</p>
                  </>
                )}
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="flex items-center gap-1 text-base font-black text-white">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <span>
                    {restaurant.deliveryTimeMins && restaurant.deliveryTimeMins > 0
                      ? `${restaurant.deliveryTimeMins}m`
                      : 'Time unavailable'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-300">
                  Radius: {restaurant.deliveryRadius ? `${restaurant.deliveryRadius} km` : '15 km'}
                </p>
              </div>
            </div>
          </div>

          {restaurant.fssaiLicense && (
            <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>FSSAI License No: {restaurant.fssaiLicense}</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Search Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Recommended Menu ({filteredItems.length})
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search within menu..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Menu Dishes Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          <UtensilsCrossed className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="font-bold text-gray-700">No menu items available yet</p>
          <p className="text-xs text-gray-400 mt-1">This restaurant hasn&apos;t published any menu items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onCustomize={(f) => openCustomization(f)}
            />
          ))}
        </div>
      )}

      {/* Customer Reviews Section */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-gray-900">Customer Ratings &amp; Reviews</h3>
            <p className="text-xs text-gray-500 mt-0.5">Real verified customer reviews for {restaurant.name}</p>
          </div>
          {restaurant.avgRating && restaurant.avgRating > 0 ? (
            <div className="flex items-center gap-1.5 rounded-2xl bg-amber-50 border border-amber-200 px-3.5 py-1.5 font-black text-amber-700 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span>{restaurant.avgRating} / 5.0</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              No reviews yet
            </span>
          )}
        </div>

        {reviewsList.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400 space-y-1">
            <p>No customer reviews submitted yet.</p>
            <p className="text-[11px] text-gray-400 font-normal">Order from this kitchen and share your feedback after delivery!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 space-y-4">
            {reviewsList.map((rev) => {
              const reviewerName = rev.isAnonymous
                ? 'Anonymous Customer'
                : rev.customer?.user?.profile?.firstName
                ? `${rev.customer.user.profile.firstName} ${rev.customer.user.profile.lastName?.[0] || ''}.`
                : 'Verified Customer';

              return (
                <div key={rev.id} className="pt-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{reviewerName}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= rev.rating ? 'fill-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && <p className="text-gray-700 font-medium">{rev.comment}</p>}

                  <p className="text-[10px] text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Food Customization Modal with Variants and Addons */}
      {selectedFoodForCustomization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {selectedFoodForCustomization.name}
                </h3>
                <p className="text-xs text-gray-500">Choose portion size &amp; add-ons</p>
              </div>
              <button
                onClick={() => {
                  setSelectedFoodForCustomization(null);
                  setSelectedVariant(null);
                  setSelectedAddons([]);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Variants Section */}
            {selectedFoodForCustomization.variants && selectedFoodForCustomization.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                    Select Portion / Variant
                  </h4>
                  <span className="text-[10px] font-bold text-orange-600 uppercase">Required</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {selectedFoodForCustomization.variants.map((v) => {
                    const isAvailable = v.isAvailable !== false;
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        disabled={!isAvailable}
                        onClick={() => setSelectedVariant(v)}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                          !isAvailable
                            ? 'opacity-40 border-gray-200 bg-gray-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-orange-600 bg-orange-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-orange-600 bg-orange-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900">{v.variantName}</span>
                            {!isAvailable && (
                              <span className="block text-[10px] text-rose-500 font-semibold">
                                Currently unavailable
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-black text-gray-900">₹{v.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons List */}
            {selectedFoodForCustomization.addonGroups?.map((group) => (
              <div key={group.id} className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  {group.groupName}
                </h4>
                <div className="space-y-2">
                  {group.addons.map((addon) => {
                    const isChecked = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <label
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon)}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
                          isChecked ? 'border-orange-600 bg-orange-50/30' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs font-bold text-gray-800">{addon.name}</span>
                        </div>
                        <span className="text-xs font-black text-orange-600">+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Add to Cart CTA */}
            <button
              onClick={handleAddCustomizedToCart}
              disabled={selectedFoodForCustomization.variants && selectedFoodForCustomization.variants.length > 0 && !selectedVariant}
              className="flex w-full items-center justify-between rounded-2xl bg-orange-600 px-5 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Add to Cart</span>
              <span className="text-sm font-black">
                ₹{((selectedVariant ? selectedVariant.price : selectedFoodForCustomization.price) +
                  selectedAddons.reduce((sum, a) => sum + a.price, 0))}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
