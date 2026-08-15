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
    packagingFee: number;
    discountAmount: number;
    tipAmount: number;
    totalCustomerTaxes: number;
    customerTotal: number;
    taxItems: TaxComponentDetail[];
    quoteTimestamp: string;
}
export interface AdminOrderQuoteData extends CustomerOrderQuoteData {
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
    distanceKm: number;
    tipAmount?: number;
    discountAmount?: number;
    packagingFee?: number;
    customerState?: string;
    restaurantState?: string;
}): Promise<CustomerOrderQuoteData | null>;
export declare function fetchActiveTaxRules(): Promise<any[]>;
