import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export interface PricingConfigData {
  restaurantCommissionPercent: number | null;
  customerDeliveryPerKm: number;
  minimumCustomerDeliveryFee: number;
  platformFee: number;
  smallOrderThreshold: number;
  smallOrderFee: number;
  riderBasePay: number;
  riderPerKmPay: number;
  riderWaitingPay: number;
  riderPeakBonus: number;
  riderLongDistanceBonus: number;
  riderBatchBonus: number;
  paymentGatewayPlanningRate: number;
}

export const DEFAULT_PRICING_CONFIG_DATA: PricingConfigData = {
  restaurantCommissionPercent: null, // UNCONFIGURED by default
  customerDeliveryPerKm: 0.0,
  minimumCustomerDeliveryFee: 15.0,
  platformFee: 3.0,
  smallOrderThreshold: 0.0,
  smallOrderFee: 0.0,
  riderBasePay: 25.0,
  riderPerKmPay: 6.0,
  riderWaitingPay: 0.0,
  riderPeakBonus: 0.0,
  riderLongDistanceBonus: 0.0,
  riderBatchBonus: 0.0,
  paymentGatewayPlanningRate: 2.0,
};

export async function fetchPricingConfig(): Promise<PricingConfigData> {
  try {
    const res = await fetch(`${API_BASE}/pricing/config`);
    if (res.ok) {
      const data = await res.json();
      return {
        restaurantCommissionPercent: data.restaurantCommissionPercent != null ? Number(data.restaurantCommissionPercent) : null,
        customerDeliveryPerKm: Number(data.customerDeliveryPerKm ?? 0),
        minimumCustomerDeliveryFee: Number(data.minimumCustomerDeliveryFee ?? 15),
        platformFee: Number(data.platformFee ?? 3),
        smallOrderThreshold: Number(data.smallOrderThreshold ?? 0),
        smallOrderFee: Number(data.smallOrderFee ?? 0),
        riderBasePay: Number(data.riderBasePay ?? 25),
        riderPerKmPay: Number(data.riderPerKmPay ?? 6),
        riderWaitingPay: Number(data.riderWaitingPay ?? 0),
        riderPeakBonus: Number(data.riderPeakBonus ?? 0),
        riderLongDistanceBonus: Number(data.riderLongDistanceBonus ?? 0),
        riderBatchBonus: Number(data.riderBatchBonus ?? 0),
        paymentGatewayPlanningRate: Number(data.paymentGatewayPlanningRate ?? 2),
      };
    }
  } catch {
    /* Fallback to default pricing parameters */
  }
  return DEFAULT_PRICING_CONFIG_DATA;
}
