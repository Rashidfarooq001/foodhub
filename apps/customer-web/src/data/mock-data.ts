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
  price: number;
  priceModifier?: number;
  isAvailable: boolean;
  displayOrder?: number;
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
  isAvailable?: boolean;
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
  deliveryTimeMins?: number;
  deliveryRadius?: number;
  distanceKm?: number;
  priceForTwo?: number;
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

export function normalizeRestaurantData(
  raw: any,
  userCoords?: { lat: number; lng: number } | null,
): RestaurantData {
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
      imageUrl: item.imageUrl ? getImageUrl(item.imageUrl) : '',
      isVeg: item.isVeg ?? true,
      isAvailable: item.isAvailable !== false,
      isBestseller: item.isBestseller ?? false,
      rating: safeNumber(item.rating, 0),
      ratingCount: item.ratingCount ? safeNumber(item.ratingCount) : 0,
      category: item.category?.name || item.category || 'Main Course',
      variants: Array.isArray(item.variants)
        ? item.variants.map((v: any) => ({
            id: String(v.id),
            variantName: String(v.variantName || v.name),
            price: safeNumber(v.price !== undefined ? v.price : (v.priceModifier !== undefined ? v.priceModifier : item.price)),
            isAvailable: v.isAvailable !== false,
            displayOrder: safeNumber(v.displayOrder, 0),
          }))
        : [],
      addonGroups: Array.isArray(item.addonGroups) ? item.addonGroups : [],
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
        imageUrl: item.imageUrl ? getImageUrl(item.imageUrl) : '',
        isVeg: item.isVeg ?? true,
        isAvailable: item.isAvailable !== false,
        isBestseller: item.isBestseller ?? false,
        rating: safeNumber(item.rating, 0),
        ratingCount: item.ratingCount ? safeNumber(item.ratingCount) : 0,
        category: cat.name ?? item.category ?? 'Main Course',
        variants: Array.isArray(item.variants)
          ? item.variants.map((v: any) => ({
              id: String(v.id),
              variantName: String(v.variantName || v.name),
              price: safeNumber(v.price !== undefined ? v.price : (v.priceModifier !== undefined ? v.priceModifier : item.price)),
              isAvailable: v.isAvailable !== false,
              displayOrder: safeNumber(v.displayOrder, 0),
            }))
          : [],
        addonGroups: Array.isArray(item.addonGroups) ? item.addonGroups : [],
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

  const avgRatingVal = r.avgRating ? safeNumber(r.avgRating) : 0;
  const ratingCountVal = r.ratingCount ? safeNumber(r.ratingCount) : (r._count?.reviews || (Array.isArray(r.reviews) ? r.reviews.length : 0));

  // 1. Calculate priceForTwo from backend or average food item prices
  let priceForTwo: number | undefined = undefined;
  if (r.priceForTwo !== undefined && r.priceForTwo !== null && safeNumber(r.priceForTwo) > 0) {
    priceForTwo = safeNumber(r.priceForTwo);
  } else if (r.costForTwo !== undefined && r.costForTwo !== null && safeNumber(r.costForTwo) > 0) {
    priceForTwo = safeNumber(r.costForTwo);
  } else if (foodItems.length > 0) {
    const avgPrice = foodItems.reduce((sum, item) => sum + item.price, 0) / foodItems.length;
    priceForTwo = Math.max(100, Math.round((avgPrice * 2) / 50) * 50);
  }

  // 2. Latitude & Longitude
  const restLat = r.latitude ? safeNumber(r.latitude) : 0;
  const restLng = r.longitude ? safeNumber(r.longitude) : 0;

  // 3. Distance & Delivery Time (Strictly from Backend Mappls Road Routing - No Fake/Manhattan Fallback)
  let distanceKm: number | undefined = undefined;
  let deliveryTimeMins: number | undefined = undefined;

  if (r.distanceKm !== undefined && r.distanceKm !== null && safeNumber(r.distanceKm) > 0) {
    distanceKm = Math.round(safeNumber(r.distanceKm) * 10) / 10;
  }

  if (r.deliveryTimeMins !== undefined && r.deliveryTimeMins !== null && safeNumber(r.deliveryTimeMins) > 0) {
    deliveryTimeMins = safeNumber(r.deliveryTimeMins);
  } else if (distanceKm !== undefined && distanceKm !== null) {
    deliveryTimeMins = Math.max(15, Math.round(20 + distanceKm * 3));
  }

  return {
    id: String(r.id || `rest-${Math.random()}`),
    slug: String(r.slug || r.id || 'restaurant'),
    name: String(r.name || 'Unnamed Restaurant'),
    phone: String(r.phone || ''),
    address: String(r.addressLine || r.address || ''),
    cuisines,
    avgRating: avgRatingVal,
    ratingCount: ratingCountVal,
    deliveryTimeMins,
    deliveryRadius: r.deliveryRadius ? safeNumber(r.deliveryRadius) : 15.0,
    distanceKm,
    priceForTwo,
    bannerUrl: r.bannerUrl ? getImageUrl(r.bannerUrl) : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=70',
    logoUrl: r.logoUrl ? getImageUrl(r.logoUrl) : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=70',
    isOpen: r.isOpen ?? true,
    fssaiLicense: r.licenseFssai || r.fssaiLicense || '',
    discountBadge: r.discountBadge || '',
    latitude: restLat,
    longitude: restLng,
    foodItems,
  };
}

