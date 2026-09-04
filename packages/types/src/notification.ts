export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  
  // Frontend generic fields
  status?: 'PENDING' | 'READ' | 'ACTIONED';
  createdAt?: string;
  time?: string;
  timestamp?: number;
  isRead?: boolean;

  // Customer order specific fields
  orderId?: string;
  orderNumber?: string;
}
