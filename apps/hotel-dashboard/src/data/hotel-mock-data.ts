// ============================================================
// TYPE DEFINITIONS ONLY — No mock data.
// All business data is loaded from the backend API at runtime.
// ============================================================

export interface KitchenOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; notes?: string }[];
  status: 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  placedAt: string;
  prepTimeMins: number;
  driverName?: string;
  driverPhone?: string;
  totalAmount: number;
}

export interface RestaurantStats {
  todayRevenue: number;
  todayOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  avgRating: number;
  totalReviews: number;
  weeklyRevenueData: { day: string; revenue: number }[];
}
