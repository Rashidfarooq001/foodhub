export interface PricingConfigData {
    restaurantCommissionPercent: number;
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
export declare const DEFAULT_PRICING_CONFIG_DATA: PricingConfigData;
export declare function fetchPricingConfig(): Promise<PricingConfigData>;
