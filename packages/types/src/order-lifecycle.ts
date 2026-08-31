import { OrderStatus } from './enums.js';

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.DRIVER_ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.DRIVER_ASSIGNED]: [OrderStatus.ARRIVED_AT_RESTAURANT, OrderStatus.CANCELLED],
  [OrderStatus.ARRIVED_AT_RESTAURANT]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.FAILED]: [],
  [OrderStatus.REFUNDED]: [],
};

export const ADMIN_ORDER_FILTERS = {
  ALL: 'ALL',
  PENDING:           [OrderStatus.PENDING],
  ACCEPTED:          [OrderStatus.ACCEPTED],
  PREPARING:         [OrderStatus.PREPARING],
  READY_FOR_PICKUP:  [OrderStatus.READY_FOR_PICKUP],
  DRIVER_ASSIGNED:   [OrderStatus.DRIVER_ASSIGNED],
  OUT_FOR_DELIVERY:  [OrderStatus.ARRIVED_AT_RESTAURANT, OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
  DELIVERED:         [OrderStatus.DELIVERED],
  CANCELLED:         [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.FAILED, OrderStatus.REFUNDED],
} as const;

export const getCustomerOrderStage = (status: OrderStatus) => {
  if ([OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(status)) return 0;
  if ([OrderStatus.PREPARING].includes(status)) return 1;
  if ([OrderStatus.READY_FOR_PICKUP].includes(status)) return 2;
  if ([OrderStatus.DRIVER_ASSIGNED, OrderStatus.ARRIVED_AT_RESTAURANT].includes(status)) return 3;
  if ([OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY].includes(status)) return 4;
  if ([OrderStatus.DELIVERED].includes(status)) return 5;
  return -1;
};
