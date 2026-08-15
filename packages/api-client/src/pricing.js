"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRICING_CONFIG_DATA = void 0;
exports.fetchPricingConfig = fetchPricingConfig;
const config_1 = require("@foodhub/config");
const API_BASE = (0, config_1.getApiBaseUrl)();
exports.DEFAULT_PRICING_CONFIG_DATA = {
    restaurantCommissionPercent: 13.0,
    customerDeliveryPerKm: 7.0,
    minimumCustomerDeliveryFee: 25.0,
    platformFee: 10.0,
    smallOrderThreshold: 199.0,
    smallOrderFee: 10.0,
    riderBasePay: 30.0,
    riderPerKmPay: 7.0,
    riderWaitingPay: 0.0,
    riderPeakBonus: 0.0,
    riderLongDistanceBonus: 0.0,
    riderBatchBonus: 0.0,
};
async function fetchPricingConfig() {
    try {
        const res = await fetch(`${API_BASE}/pricing/config`);
        if (res.ok) {
            const data = await res.json();
            return {
                restaurantCommissionPercent: Number(data.restaurantCommissionPercent ?? 13),
                customerDeliveryPerKm: Number(data.customerDeliveryPerKm ?? 7),
                minimumCustomerDeliveryFee: Number(data.minimumCustomerDeliveryFee ?? 25),
                platformFee: Number(data.platformFee ?? 10),
                smallOrderThreshold: Number(data.smallOrderThreshold ?? 199),
                smallOrderFee: Number(data.smallOrderFee ?? 10),
                riderBasePay: Number(data.riderBasePay ?? 30),
                riderPerKmPay: Number(data.riderPerKmPay ?? 7),
                riderWaitingPay: Number(data.riderWaitingPay ?? 0),
                riderPeakBonus: Number(data.riderPeakBonus ?? 0),
                riderLongDistanceBonus: Number(data.riderLongDistanceBonus ?? 0),
                riderBatchBonus: Number(data.riderBatchBonus ?? 0),
            };
        }
    }
    catch {
        /* Fallback to default pricing parameters */
    }
    return exports.DEFAULT_PRICING_CONFIG_DATA;
}
