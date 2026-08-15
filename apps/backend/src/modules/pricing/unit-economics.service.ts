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
  taxes: number;
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
    const packagingFee = Math.max(0, req.packagingFee ?? 15.0);

    // Customer Delivery Fee: MAX(minimumFee, distance * perKm)
    const rawDeliveryFee = distanceKm * config.customerDeliveryPerKm;
    const customerDeliveryFee = Math.max(
      config.minimumCustomerDeliveryFee,
      Math.round(rawDeliveryFee * 100) / 100,
    );

    // Platform Fee (Configurable, default ₹10)
    const platformFee = config.platformFee;

    // Small Order Fee (Apply ₹10 if foodSubtotal < ₹199)
    const smallOrderFee = foodSubtotal > 0 && foodSubtotal < config.smallOrderThreshold ? config.smallOrderFee : 0;

    // Taxes (5% GST on food)
    const taxes = Math.round(foodSubtotal * 0.05 * 100) / 100;

    // Customer Payable Total
    const customerTotal = Math.max(
      0,
      Math.round(
        (foodSubtotal + customerDeliveryFee + platformFee + smallOrderFee + packagingFee + taxes + tipAmount - discountAmount) * 100,
      ) / 100,
    );

    // Restaurant Commission & Settlement (13% default)
    const restaurantCommissionPercent = config.restaurantCommissionPercent;
    const restaurantCommission = Math.round(foodSubtotal * (restaurantCommissionPercent / 100) * 100) / 100;
    const restaurantSettlement = Math.round((foodSubtotal + packagingFee - restaurantCommission) * 100) / 100;

    // Rider Earnings Payout Engine
    const riderBasePay = config.riderBasePay;
    const riderDistancePay = Math.round(distanceKm * config.riderPerKmPay * 100) / 100;
    const riderWaitingPay = config.riderWaitingPay;
    const riderPeakBonus = config.riderPeakBonus;
    const riderLongDistanceBonus = config.riderLongDistanceBonus;
    const riderBatchBonus = config.riderBatchBonus;
    const riderTip = tipAmount; // 100% of customer tip goes directly to rider

    const totalRiderPayout = Math.round(
      (riderBasePay + riderDistancePay + riderWaitingPay + riderPeakBonus + riderLongDistanceBonus + riderBatchBonus + riderTip) * 100,
    ) / 100;

    // Platform Contribution Margin
    const platformGrossRevenue = Math.round(
      (restaurantCommission + platformFee + smallOrderFee + customerDeliveryFee) * 100,
    ) / 100;

    const riderDirectDeliveryCost = totalRiderPayout - riderTip;
    const platformContributionMargin = Math.round((platformGrossRevenue - riderDirectDeliveryCost) * 100) / 100;

    return {
      foodSubtotal,
      customerDeliveryFee,
      platformFee,
      smallOrderFee,
      packagingFee,
      discountAmount,
      taxes,
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
