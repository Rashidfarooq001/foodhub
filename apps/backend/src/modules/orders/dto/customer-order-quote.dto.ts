import { OrderQuoteResult } from '../../tax/order-quote.service';

export class CustomerOrderQuoteDto {
  foodSubtotal: number;
  customerDeliveryFee: number;
  platformFee: number;
  smallOrderFee: number;
  packagingFee: number;
  discountAmount: number;
  tipAmount: number;

  distanceKm: number;
  distanceType: 'HAVERSINE' | 'ROAD_ROUTING';
  deliveryEligible: boolean;
  deliveryRadiusKm: number;
  locationSource: string;

  totalCustomerTaxes: number;
  customerTotal: number;
  taxItems: Array<{
    componentCode: string;
    taxableAmount: number;
    totalTax: number;
  }>;
  quoteTimestamp: string;
}

/**
 * Sanitizes full 3-sided unit economics into customer-safe DTO.
 * Explicitly excludes: restaurantCommission, restaurantCommissionGst, restaurantSettlement,
 * riderPayout, paymentGatewayCost, statutoryGstLiability, platformContributionMargin.
 */
export function toCustomerOrderQuote(fullQuote: OrderQuoteResult): CustomerOrderQuoteDto {
  return {
    foodSubtotal: fullQuote.foodSubtotal,
    customerDeliveryFee: fullQuote.customerDeliveryFee,
    platformFee: fullQuote.platformFee,
    smallOrderFee: fullQuote.smallOrderFee,
    packagingFee: fullQuote.packagingFee,
    discountAmount: fullQuote.discountAmount,
    tipAmount: fullQuote.tipAmount,

    distanceKm: fullQuote.distanceKm,
    distanceType: fullQuote.distanceType,
    deliveryEligible: fullQuote.deliveryEligible,
    deliveryRadiusKm: fullQuote.deliveryRadiusKm,
    locationSource: fullQuote.locationSource,

    totalCustomerTaxes: fullQuote.totalCustomerTaxes,
    customerTotal: fullQuote.customerTotal,
    taxItems: (fullQuote.taxItems || []).map((item) => ({
      componentCode: item.componentCode,
      taxableAmount: item.taxableAmount,
      totalTax: item.totalTax,
    })),
    quoteTimestamp: fullQuote.quoteTimestamp,
  };
}
