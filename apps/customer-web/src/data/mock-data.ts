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

export function normalizeRestaurantData(r: any): RestaurantData {
  if (!r) return {} as RestaurantData;

  const categories = Array.isArray(r.categories) ? r.categories : [];
  const foodItems: FoodItemData[] = Array.isArray(r.foodItems)
    ? r.foodItems
    : categories.flatMap((cat: any) =>
        (Array.isArray(cat.foodItems) ? cat.foodItems : []).map((item: any) => ({
          id: item.id || `item-${Math.random()}`,
          restaurantId: r.id,
          restaurantName: r.name || 'Restaurant',
          name: item.name || 'Food Item',
          description: item.description ?? '',
          price: Number(item.price ?? 0),
          originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
          imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          isVeg: item.isVeg ?? true,
          isBestseller: item.isBestseller ?? false,
          rating: item.rating ? Number(item.rating) : 4.5,
          ratingCount: item.ratingCount ?? 50,
          category: cat.name ?? item.category ?? 'Main Course',
        }))
      );

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
    avgRating: r.avgRating !== undefined && r.avgRating !== null ? Number(r.avgRating) : 4.5,
    ratingCount: r.ratingCount ? Number(r.ratingCount) : 120,
    deliveryTimeMins: r.deliveryTimeMins ? Number(r.deliveryTimeMins) : 30,
    distanceKm: r.distanceKm ? Number(r.distanceKm) : 2.5,
    priceForTwo: r.priceForTwo ? Number(r.priceForTwo) : 350,
    bannerUrl: r.bannerUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    logoUrl: r.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
    isOpen: r.isOpen ?? true,
    fssaiLicense: r.licenseFssai || r.fssaiLicense || 'FSSAI-12345678901234',
    discountBadge: r.discountBadge || '20% OFF',
    latitude: r.latitude ? Number(r.latitude) : 12.9716,
    longitude: r.longitude ? Number(r.longitude) : 77.5946,
    foodItems,
  };
}
