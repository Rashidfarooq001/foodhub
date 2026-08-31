import { OrderStatus } from './enums.js';
export declare const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare const ADMIN_ORDER_FILTERS: {
    ALL: string;
    PENDING: OrderStatus[];
    PREPARING: OrderStatus[];
    OUT_FOR_DELIVERY: OrderStatus[];
    DELIVERED: OrderStatus[];
    CANCELLED: OrderStatus[];
};
export declare const getCustomerOrderStage: (status: OrderStatus) => 1 | 2 | 4 | 0 | 3 | 5 | -1;
