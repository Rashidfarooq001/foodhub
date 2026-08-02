// ============================================================
// TYPE DEFINITIONS ONLY — No mock data.
// All business data is loaded from the backend API at runtime.
// ============================================================

export interface DeliveryJob {
  id: string;
  orderNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  restaurantPhone: string;
  customerName: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  customerPhone: string;
  distanceKm: number;
  estimatedEarnings: number;
  estimatedTimeMins: number;
  deliveryOtp: string;
  paymentMethod?: 'COD' | 'ONLINE';
  codAmountToCollect?: number;
 status:
  | 'PENDING'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';
  items: { name: string; quantity: number }[];
}

export interface DriverStats {
  todayEarnings: number;
  todayDeliveries: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  acceptanceRate: number;
  completionRate: number;
  avgRating: number;
  totalRatings: number;
  walletBalance: number;
  dutyStatus: string;
}
