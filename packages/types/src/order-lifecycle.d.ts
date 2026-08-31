import { OrderStatus } from './enums.js';
export declare const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare const ADMIN_ORDER_FILTERS: {
    readonly ALL: "ALL";
    readonly PENDING: readonly [OrderStatus.PENDING];
    readonly ACCEPTED: readonly [OrderStatus.ACCEPTED];
    readonly PREPARING: readonly [OrderStatus.PREPARING];
    readonly DRIVER_ASSIGNED: readonly [OrderStatus.DRIVER_ASSIGNED];
    readonly OUT_FOR_DELIVERY: readonly [OrderStatus.ARRIVED_AT_RESTAURANT, OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY];
    readonly DELIVERED: readonly [OrderStatus.DELIVERED];
    readonly CANCELLED: readonly [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.FAILED, OrderStatus.REFUNDED];
};
export declare const getCustomerOrderStage: (status: OrderStatus) => 1 | 2 | 4 | 0 | 3 | -1;
