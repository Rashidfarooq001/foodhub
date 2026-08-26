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
  paymentMethod?: 'COD' | 'ONLINE';
  codAmountToCollect?: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DRIVER_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  items: { name: string; quantity: number }[];
}

export interface DriverStats {
  todayEarnings: number;
  todayDeliveries: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalEarnings: number;
  pendingSettlement: number;
  availableForSettlement: number;
  settledAmount: number;
  acceptanceRate: number;
  completionRate: number;
  avgRating: number;
  totalRatings: number;
  dutyStatus: string;
}
