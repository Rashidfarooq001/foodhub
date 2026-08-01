export const AUTH_ENABLED = false;

export function isAuthEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AUTH_ENABLED !== undefined) {
    return process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
  }
  return AUTH_ENABLED;
}

export const APP_CONSTANTS = {
  APP_NAME: 'FoodHub',
  DEFAULT_CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  DEFAULT_TAX_PERCENT: 5.0,
  DEFAULT_PACKAGING_FEE: 15.0,
  BASE_DELIVERY_FEE: 30.0,
  PER_KM_DELIVERY_FEE: 10.0,
  GEOFENCE_RADIUS_KM: 7.0,
  DRIVER_AUTO_DISPATCH_RADIUS_KM: 3.0,
  KITCHEN_ACCEPTANCE_TIMEOUT_SEC: 90,
  DRIVER_ACCEPTANCE_TIMEOUT_SEC: 30,
};
