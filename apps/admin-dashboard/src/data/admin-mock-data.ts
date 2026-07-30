// ============================================================
// TYPE DEFINITIONS ONLY — No mock data.
// All business data is loaded from the backend API at runtime.
// ============================================================

export interface PendingRestaurantApproval {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  cuisineTypes: string[];
  address: string;
  fssaiNumber: string;
  gstin: string;
  bankAccount: string;
  ifsc: string;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface PendingDriverApproval {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  vehicleType: string;
  licenseNumber: string;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface AdminStats {
  todayOrders: number;
  todayRevenue: number;
  activeRestaurants: number;
  onlineDrivers: number;
  pendingApprovals: number;
  cancelledOrders: number;
  refundRequests: number;
  platformGrowth: string;
  weeklyRevenueData: { day: string; revenue: number; orders: number }[];
}
