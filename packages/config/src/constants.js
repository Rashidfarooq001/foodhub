"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_CONSTANTS = exports.AUTH_ENABLED = void 0;
exports.isAuthEnabled = isAuthEnabled;
exports.AUTH_ENABLED = true;
function isAuthEnabled() {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AUTH_ENABLED !== undefined) {
        return process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
    }
    return exports.AUTH_ENABLED;
}
exports.APP_CONSTANTS = {
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
