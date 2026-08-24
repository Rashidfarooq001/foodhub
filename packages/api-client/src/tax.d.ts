export interface TaxComponentDetail {
    componentCode: string;
    taxableAmount: number;
    rate?: number;
    cgst?: number;
    sgst?: number;
    utgst?: number;
    igst?: number;
    totalTax: number;
    taxCategory?: string;
    sacCode?: string;
    sectionReference?: string;
    legalReference?: string;
    isInterstate?: boolean;
}
export interface CustomerOrderQuoteData {
    foodSubtotal: number;
    customerDeliveryFee: number;
    platformFee: number;
    smallOrderFee: number;
    discountAmount: number;
    tipAmount: number;
    distanceKm: number;
    distanceType: 'MAPPLS_ROAD_ROUTING';
    deliveryEligible: boolean;
    deliveryRadiusKm: number;
    locationSource: string;
    totalCustomerTaxes: number;
    customerTotal: number;
    taxItems: TaxComponentDetail[];
    quoteTimestamp: string;
    deliveryDistanceKm?: number;
    deliveryFeeBaseKm?: number;
    deliveryFeeBaseAmount?: number;
    deliveryFeePerExtraKm?: number;
}
export interface AdminOrderQuoteData extends CustomerOrderQuoteData {
    packagingFee: number;
    restaurantCommissionPercent: number;
    restaurantCommission: number;
    restaurantCommissionGst: number;
    restaurantSettlement: number;
    riderBasePay: number;
    riderDistancePay: number;
    riderTip: number;
    totalRiderPayout: number;
    paymentGatewayCost: number;
    statutoryGstLiability: number;
    platformOperatingRevenue: number;
    platformContributionMargin: number;
    taxEngineVersion: string;
}
export type OrderQuoteData = CustomerOrderQuoteData;
export declare function fetchOrderQuote(req: {
    foodSubtotal: number;
    distanceKm?: number;
    restaurantId?: string;
    latitude?: number;
    longitude?: number;
    locationSource?: 'CURRENT_GPS' | 'MANUAL_GEOCODED' | 'SAVED_ADDRESS';
    tipAmount?: number;
    discountAmount?: number;
    customerState?: string;
    restaurantState?: string;
}): Promise<CustomerOrderQuoteData | null>;
export declare function fetchActiveTaxRules(): Promise<any[]>;


