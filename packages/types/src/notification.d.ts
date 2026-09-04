export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    status?: 'PENDING' | 'READ' | 'ACTIONED';
    createdAt?: string;
    time?: string;
    timestamp?: number;
    isRead?: boolean;
    orderId?: string;
    orderNumber?: string;
}
