import { Injectable } from '@nestjs/common';
import { PricingConfigDto, PricingService } from './pricing.service';

export interface OrderPricingRequest {
  foodSubtotal: number;
  distanceKm: number;
  tipAmount?: number;
  discountAmount?: number;
  packagingFee?: number;
}

export interface UnitEconomicsBreakdown {
  foodSubtotal: number;
  customerDeliveryFee: number;
  platformFee: number;
  smallOrderFee: number;
  packagingFee: number;
  discountAmount: number;
  totalCustomerTaxes: number;
  tipAmount: number;
  customerTotal: number;

  restaurantCommissionPercent: number;
  restaurantCommission: number;
  restaurantSettlement: number;

  riderBasePay: number;
  riderDistancePay: number;
  riderWaitingPay: number;
  riderPeakBonus: number;
  riderLongDistanceBonus: number;
  riderBatchBonus: number;
  riderTip: number;
  totalRiderPayout: number;

  platformGrossRevenue: number;
  platformContributionMargin: number;
}

@Injectable()
export class UnitEconomicsService {
  constructor(private readonly pricingService: PricingService) {}

  async calculateOrderPricing(req: OrderPricingRequest): Promise<UnitEconomicsBreakdown> {
    const config = await this.pricingService.getActivePricingConfig();
    return this.computeBreakdown(req, config);
  }

  computeBreakdown(req: OrderPricingRequest, config: PricingConfigDto): UnitEconomicsBreakdown {
    const foodSubtotal = Math.max(0, req.foodSubtotal || 0);
    const distanceKm = Math.max(0, req.distanceKm || 0);
    const tipAmount = Math.max(0, req.tipAmount || 0);
    const discountAmount = Math.max(0, req.discountAmount || 0);
    const packagingFee = 0.0;

    // Delivery Fee (Using DB Config)
    let customerDeliveryFee = 0;
    if (distanceKm <= 3.0) {
      customerDeliveryFee = config.minimumCustomerDeliveryFee;
    } else {
      const extraKm = distanceKm - 3.0;
      customerDeliveryFee =
        Math.round(
          (config.minimumCustomerDeliveryFee + extraKm * config.customerDeliveryPerKm) * 100,
        ) / 100;
    }

    // Platform Fee (Using DB Config)
    const platformFee = config.platformFee;
    const smallOrderFee = 0.0;

    // Taxes
    const totalCustomerTaxes =
      Math.round(foodSubtotal * ((config.foodGstRate || 0) / 100) * 100) / 100;

    // Customer Total
    const customerTotal = Math.max(
      0,
      Math.round(
        (foodSubtotal +
          customerDeliveryFee +
          platformFee +
          totalCustomerTaxes +
          tipAmount -
          discountAmount) *
          100,
      ) / 100,
    );

    // Restaurant Commission & Settlement
    const restaurantCommissionPercent = config.restaurantCommissionPercent || 13.0;
    const restaurantCommission =
      Math.round(foodSubtotal * (restaurantCommissionPercent / 100) * 100) / 100;
    const restaurantCommissionGst = Math.round(restaurantCommission * 0.18 * 100) / 100;
    const restaurantSettlement =
      Math.round((foodSubtotal - restaurantCommission - restaurantCommissionGst) * 100) / 100;

    // Rider Payout
    const riderBasePay = config.riderBasePay;
    const riderDistancePay = Math.round(distanceKm * config.riderPerKmPay * 100) / 100;
    const riderWaitingPay = config.riderWaitingPay;
    const riderPeakBonus = config.riderPeakBonus;
    const riderLongDistanceBonus = config.riderLongDistanceBonus;
    const riderBatchBonus = config.riderBatchBonus;
    const riderTip = tipAmount;

    const totalRiderPayout =
      Math.round(
        (riderBasePay +
          riderDistancePay +
          riderWaitingPay +
          riderPeakBonus +
          riderLongDistanceBonus +
          riderBatchBonus +
          riderTip) *
          100,
      ) / 100;

    // Platform Margin
    const platformGrossRevenue =
      Math.round((restaurantCommission + platformFee + customerDeliveryFee) * 100) / 100;

    const riderDirectDeliveryCost = totalRiderPayout - riderTip;
    const platformContributionMargin =
      Math.round((platformGrossRevenue - riderDirectDeliveryCost) * 100) / 100;

    return {
      foodSubtotal,
      customerDeliveryFee,
      platformFee,
      smallOrderFee: 0,
      packagingFee: 0,
      discountAmount,
      totalCustomerTaxes,
      tipAmount,
      customerTotal,
      restaurantCommissionPercent,
      restaurantCommission,
      restaurantSettlement,
      riderBasePay,
      riderDistancePay,
      riderWaitingPay,
      riderPeakBonus,
      riderLongDistanceBonus,
      riderBatchBonus,
      riderTip,
      totalRiderPayout,
      platformGrossRevenue,
      platformContributionMargin,
    };
  }
}
