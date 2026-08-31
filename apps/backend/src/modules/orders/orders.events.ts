// Order Socket.IO Event Constants - FoodHub Platform Enterprise 2026
export const ORDER_EVENTS = {
  ORDER_CREATED:            'order.created',
  ORDER_CONFIRMED:          'order.confirmed',
  ORDER_ACCEPTED:           'order.accepted', // Backwards compatibility alias for order.confirmed
  ORDER_PREPARING:          'order.preparing',
  ORDER_READY:              'order.ready',
  JOB_AVAILABLE:            'job.available',
  JOB_CLAIMED:              'job.claimed',
  DRIVER_ASSIGNED:          'driver.assigned',
  DRIVER_LOCATION:          'driver.location',
  ORDER_ARRIVED_RESTAURANT: 'order.arrived_restaurant',
  ORDER_PICKED_UP:          'order.picked_up',
  ORDER_OUT_FOR_DELIVERY:   'order.out_for_delivery',
  ORDER_RIDER_ARRIVED:      'order.rider_arrived',
  RIDER_ARRIVED:            'order.rider_arrived', // Alias
  ORDER_DELIVERED:          'order.delivered',
  ORDER_CANCELLED:          'order.cancelled',
  ORDER_REJECTED:           'order.rejected',
  STATUS_UPDATED:           'order.status_updated',
  REFUND_INITIATED:         'refund.initiated',
  DELIVERY_LOCATION_UPDATED:'order:delivery-location-updated',
  DRIVER_STATUS_CHANGED:    'driver.status_changed',
  RESTAURANT_STATUS_CHANGED:'restaurant.status_changed',
  USER_STATUS_CHANGED:      'user.status_changed',
} as const;

export type OrderEventName = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

