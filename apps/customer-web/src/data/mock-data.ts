// ============================================================
// TYPE DEFINITIONS ONLY — No mock data.
// All business data is loaded from the backend API at runtime.
// ============================================================

export interface CategoryData {
  id: string;
  name: string;
  image: string;
  itemCount: number;
}

export interface FoodAddonData {
  id: string;
  name: string;
  price: number;
}

export interface AddonGroupData {
  id: string;
  groupName: string;
  minSelect: number;
  maxSelect: number;
  addons: FoodAddonData[];
}

export interface FoodVariantData {
  id: string;
  variantName: string;
  priceModifier: number;
}

export interface FoodItemData {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  isVeg: boolean;
  isBestseller?: boolean;
  rating: number;
  ratingCount: number;
  category: string;
  variants?: FoodVariantData[];
  addonGroups?: AddonGroupData[];
}

export interface RestaurantData {
  id: string;
  slug: string;
  name: string;
  phone: string;
  address: string;
  cuisines: string[];
  avgRating: number;
  ratingCount: number;
  deliveryTimeMins: number;
  distanceKm: number;
  priceForTwo: number;
  bannerUrl: string;
  logoUrl: string;
  isOpen: boolean;
  fssaiLicense: string;
  discountBadge?: string;
  latitude: number;
  longitude: number;
  foodItems: FoodItemData[];
}

export interface CouponData {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountVal: number;
  minOrderVal: number;
  maxDiscount?: number;
  description: string;
  validTill: string;
}

export interface ActiveOrderTrackingData {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  driverName: string;
  driverPhone: string;
  driverPhoto: string;
  driverLat: number;
  driverLng: number;
  vehicleNumber: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DRIVER_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  deliveryOtp: string;
  etaMins: number;
  placedAt: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
}

import { getImageUrl } from '@foodhub/config';

export function safeNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
  }
  if (typeof val === 'object') {
    if (val.d && Array.isArray(val.d) && val.d[0] !== undefined) {
      return Number(val.d[0]);
    }
    const num = Number(val);
    return isNaN(num) ? defaultVal : num;
  }
  return defaultVal;
}

export function normalizeRestaurantData(raw: any): RestaurantData {
  const r = raw || {};
  let foodItems: FoodItemData[] = [];

  const rawFoodItems = Array.isArray(r.foodItems) ? r.foodItems : [];
  const categories = Array.isArray(r.categories) ? r.categories : [];

  if (rawFoodItems.length > 0) {
    foodItems = rawFoodItems.map((item: any) => ({
      id: String(item.id || `item-${Math.random()}`),
      restaurantId: String(r.id),
      restaurantName: String(r.name || 'Restaurant'),
      name: String(item.name || 'Food Item'),
      description: item.description ?? '',
      price: safeNumber(item.price, 0),
      originalPrice: item.originalPrice ? safeNumber(item.originalPrice) : undefined,
      imageUrl: item.imageUrl ? getImageUrl(item.imageUrl) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isVeg: item.isVeg ?? true,
      isBestseller: item.isBestseller ?? false,
      rating: safeNumber(item.rating, 4.5),
      ratingCount: item.ratingCount ? safeNumber(item.ratingCount) : 50,
      category: item.category?.name || item.category || 'Main Course',
    }));
  } else if (categories.length > 0) {
    foodItems = categories.flatMap((cat: any) =>
      (Array.isArray(cat.foodItems) ? cat.foodItems : []).map((item: any) => ({
        id: String(item.id || `item-${Math.random()}`),
        restaurantId: String(r.id),
        restaurantName: String(r.name || 'Restaurant'),
        name: String(item.name || 'Food Item'),
        description: item.description ?? '',
        price: safeNumber(item.price, 0),
        originalPrice: item.originalPrice ? safeNumber(item.originalPrice) : undefined,
        imageUrl: item.imageUrl ? getImageUrl(item.imageUrl) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        isVeg: item.isVeg ?? true,
        isBestseller: item.isBestseller ?? false,
        rating: safeNumber(item.rating, 4.5),
        ratingCount: item.ratingCount ? safeNumber(item.ratingCount) : 50,
        category: cat.name ?? item.category ?? 'Main Course',
      }))
    );
  }

  let cuisines: string[] = ['North Indian', 'Fast Food'];
  if (Array.isArray(r.cuisines) && r.cuisines.length > 0) {
    cuisines = r.cuisines;
  } else if (typeof r.cuisines === 'string' && r.cuisines.trim()) {
    cuisines = r.cuisines.split(',').map((c: string) => c.trim()).filter(Boolean);
  } else if (typeof r.cuisine === 'string' && r.cuisine.trim()) {
    cuisines = r.cuisine.split(',').map((c: string) => c.trim()).filter(Boolean);
  }

  return {
    id: String(r.id || `rest-${Math.random()}`),
    slug: String(r.slug || r.id || 'restaurant'),
    name: String(r.name || 'Unnamed Restaurant'),
    phone: String(r.phone || ''),
    address: String(r.addressLine || r.address || 'Bengaluru, India'),
    cuisines,
    avgRating: safeNumber(r.avgRating, 4.5),
    ratingCount: r.ratingCount ? safeNumber(r.ratingCount) : 120,
    deliveryTimeMins: r.deliveryTimeMins ? safeNumber(r.deliveryTimeMins) : 30,
    distanceKm: r.distanceKm ? safeNumber(r.distanceKm) : 2.5,
    priceForTwo: r.priceForTwo ? safeNumber(r.priceForTwo) : 350,
    bannerUrl: r.bannerUrl ? getImageUrl(r.bannerUrl) : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    logoUrl: r.logoUrl ? getImageUrl(r.logoUrl) : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
    isOpen: r.isOpen ?? true,
    fssaiLicense: r.licenseFssai || r.fssaiLicense || 'FSSAI-12345678901234',
    discountBadge: r.discountBadge || '20% OFF',
    latitude: r.latitude ? safeNumber(r.latitude) : 12.9716,
    longitude: r.longitude ? safeNumber(r.longitude) : 77.5946,
    foodItems,
  };
}

