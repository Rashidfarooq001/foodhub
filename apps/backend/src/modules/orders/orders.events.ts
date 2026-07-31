// Order Socket.IO Event Constants
export const ORDER_EVENTS = {
  ORDER_CREATED:          'order.created',
  ORDER_ACCEPTED:         'order.accepted',
  ORDER_PREPARING:        'order.preparing',
  ORDER_READY:            'order.ready',
  DRIVER_ASSIGNED:        'driver.assigned',
  DRIVER_LOCATION:        'driver.location',
  ORDER_PICKED_UP:        'order.picked_up',
  ORDER_DELIVERED:        'order.delivered',
  ORDER_CANCELLED:        'order.cancelled',
  STATUS_UPDATED:         'status.updated',
  REFUND_INITIATED:       'refund.initiated',
} as const;

export type OrderEventName = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];
