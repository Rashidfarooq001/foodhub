"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRICING_CONFIG_DATA = void 0;
exports.fetchPricingConfig = fetchPricingConfig;
const config_1 = require("@foodhub/config");
const API_BASE = (0, config_1.getApiBaseUrl)();
exports.DEFAULT_PRICING_CONFIG_DATA = {
    restaurantCommissionPercent: 15.0,
    customerDeliveryPerKm: 8.0,
    minimumCustomerDeliveryFee: 30.0,
    platformFee: 5.0,
    smallOrderThreshold: 200.0,
    smallOrderFee: 15.0,
    riderBasePay: 25.0,
    riderPerKmPay: 6.0,
    riderWaitingPay: 0.0,
    riderPeakBonus: 0.0,
    riderLongDistanceBonus: 0.0,
    riderBatchBonus: 0.0,
    paymentGatewayPlanningRate: 2.0,
};
async function fetchPricingConfig() {
    try {
        const res = await fetch(`${API_BASE}/pricing/config`);
        if (res.ok) {
            const data = await res.json();
            return {
                restaurantCommissionPercent: Number(data.restaurantCommissionPercent ?? 15),
                customerDeliveryPerKm: Number(data.customerDeliveryPerKm ?? 8),
                minimumCustomerDeliveryFee: Number(data.minimumCustomerDeliveryFee ?? 30),
                platformFee: Number(data.platformFee ?? 5),
                smallOrderThreshold: Number(data.smallOrderThreshold ?? 200),
                smallOrderFee: Number(data.smallOrderFee ?? 15),
                riderBasePay: Number(data.riderBasePay ?? 25),
                riderPerKmPay: Number(data.riderPerKmPay ?? 6),
                riderWaitingPay: Number(data.riderWaitingPay ?? 0),
                riderPeakBonus: Number(data.riderPeakBonus ?? 0),
                riderLongDistanceBonus: Number(data.riderLongDistanceBonus ?? 0),
                riderBatchBonus: Number(data.riderBatchBonus ?? 0),
                paymentGatewayPlanningRate: Number(data.paymentGatewayPlanningRate ?? 2),
            };
        }
    }
    catch {
        /* Fallback to default pricing parameters */
    }
    return exports.DEFAULT_PRICING_CONFIG_DATA;
}
