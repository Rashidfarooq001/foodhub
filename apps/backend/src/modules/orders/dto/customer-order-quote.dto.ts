import { OrderQuoteResult } from '../../tax/order-quote.service';

export class CustomerOrderQuoteDto {
  foodSubtotal: number;
  customerDeliveryFee: number;
  platformFee: number;
  smallOrderFee: number;
  discountAmount: number;
  appliedCouponCode?: string;
  couponMessage?: string;
  tipAmount: number;

  distanceKm: number | null;
  etaMinutes: number | null;
  routeAvailable: boolean;
  serviceable: boolean;
  distanceType: 'MAPPLS_ROAD_ROUTING';
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

  deliveryDistanceKm: number | null;
  deliveryFeeBaseKm: number;
  deliveryFeeBaseAmount: number;
  deliveryFeePerExtraKm: number;
}

/**
 * Sanitizes full 3-sided unit economics into customer-safe DTO.
 * Explicitly excludes: restaurantCommission, restaurantCommissionGst, restaurantSettlement,
 * riderPayout, paymentGatewayCost, statutoryGstLiability, platformContributionMargin, packagingFee.
 */
export function toCustomerOrderQuote(fullQuote: OrderQuoteResult): CustomerOrderQuoteDto {
  return {
    foodSubtotal: fullQuote.foodSubtotal,
    customerDeliveryFee: fullQuote.customerDeliveryFee,
    platformFee: fullQuote.platformFee,
    smallOrderFee: fullQuote.smallOrderFee,
    discountAmount: fullQuote.discountAmount,
    appliedCouponCode: fullQuote.appliedCouponCode,
    couponMessage: fullQuote.couponMessage,
    tipAmount: fullQuote.tipAmount,

    distanceKm: fullQuote.distanceKm,
    etaMinutes: fullQuote.etaMinutes,
    routeAvailable: fullQuote.routeAvailable,
    serviceable: fullQuote.serviceable,
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

    deliveryDistanceKm: fullQuote.deliveryDistanceKm,
    deliveryFeeBaseKm: fullQuote.deliveryFeeBaseKm,
    deliveryFeeBaseAmount: fullQuote.deliveryFeeBaseAmount,
    deliveryFeePerExtraKm: fullQuote.deliveryFeePerExtraKm,
  };
}
