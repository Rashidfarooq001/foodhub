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
