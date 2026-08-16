import { Injectable } from '@nestjs/common';
import { TaxEngineService, TaxComponentOutput } from './tax-engine.service';
import { PricingService } from '../pricing/pricing.service';
import { DistanceService } from '../geolocation/distance.service';

export interface OrderQuoteRequest {
  foodSubtotal: number;
  distanceKm?: number;
  restaurantId?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'CURRENT_GPS' | 'MANUAL_GEOCODED' | 'SAVED_ADDRESS';
  tipAmount?: number;
  discountAmount?: number;
  packagingFee?: number;
  customerState?: string;
  restaurantState?: string;
}

export interface OrderQuoteResult {
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

  taxItems: TaxComponentOutput[];
  restaurantFoodGst: number;
  platformFeeGst: number;
  smallOrderFeeGst: number;
  deliveryFeeGst: number;
  totalCustomerTaxes: number;
  customerTotal: number;

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
  quoteTimestamp: string;
}

@Injectable()
export class OrderQuoteService {
  constructor(
    private readonly taxEngine: TaxEngineService,
    private readonly pricingService: PricingService,
    private readonly distanceService: DistanceService,
  ) {}

  async calculateQuote(req: OrderQuoteRequest): Promise<OrderQuoteResult> {
    const config = await this.pricingService.getActivePricingConfig();
    const foodSubtotal = Math.max(0, req.foodSubtotal || 0);
    const tipAmount = Math.max(0, req.tipAmount || 0);
    const discountAmount = Math.max(0, req.discountAmount || 0);
    const packagingFee = 0.0; // CUSTOMER PACKAGING FEE IS REMOVED COMPLETELY (₹0)

    const customerState = req.customerState || 'J&K';
    const restaurantState = req.restaurantState || 'J&K';

    // 1. Authoritative Distance & Radius Check via DistanceService
    let distanceKm = Math.max(0, req.distanceKm || 0);
    let deliveryEligible = true;
    let deliveryRadiusKm = 15.0;
    const locationSource = req.locationSource || 'MANUAL_GEOCODED';

    if (req.restaurantId && typeof req.latitude === 'number' && typeof req.longitude === 'number') {
      const distRes = await this.distanceService.getDeliveryDistance(
        req.restaurantId,
        req.latitude,
        req.longitude,
      );
      if (distRes.valid || distRes.distanceKm > 0) {
        distanceKm = distRes.distanceKm;
        deliveryEligible = distRes.valid;
        deliveryRadiusKm = distRes.radiusKm;
      }
    }

    // 2. Authoritative Fixed Delivery Fee (₹15.00 business fee)
    let customerDeliveryFee = 15.0;

    if (!deliveryEligible || distanceKm > 15.0) {
      deliveryEligible = false;
      customerDeliveryFee = 15.0;
    }

    // 3. Platform Fee (Fixed ₹3.00) & Small Order Fee (Disabled: ₹0.00)
    const platformFee = 3.0;
    const smallOrderFee = 0.0;

    // 4. Tax Components (GST = ₹0.00)
    const foodTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RESTAURANT_FOOD_SERVICE',
      taxableAmount: 0,
      supplierState: restaurantState,
      recipientState: customerState,
    });

    const platformTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'PLATFORM_FEE',
      taxableAmount: 0,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const smallOrderTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'SMALL_ORDER_FEE',
      taxableAmount: 0,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const deliveryTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'DELIVERY_SERVICE',
      taxableAmount: 0,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const tipTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RIDER_TIP',
      taxableAmount: 0,
      supplierState: customerState,
      recipientState: customerState,
    });

    const taxItems: TaxComponentOutput[] = [foodTax, platformTax, smallOrderTax, deliveryTax, tipTax];

    const restaurantFoodGst = 0.0;
    const platformFeeGst = 0.0;
    const smallOrderFeeGst = 0.0;
    const deliveryFeeGst = 0.0;

    const totalCustomerTaxes = 0.0;

    // 5. Customer Total (Food Subtotal + ₹15 Delivery Fee + ₹3 Platform Fee + ₹0 GST - Discounts)
    const customerTotal = Math.max(
      0,
      Math.round(
        (foodSubtotal + customerDeliveryFee + platformFee + totalCustomerTaxes + tipAmount - discountAmount) * 100,
      ) / 100,
    );

    // 5. Merchant Settlement & Commission GST (Commission = 15% of foodSubtotal)
    const restaurantCommissionPercent = config.restaurantCommissionPercent;
    const restaurantCommission = Math.round(foodSubtotal * (restaurantCommissionPercent / 100) * 100) / 100;

    const commissionTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RESTAURANT_COMMISSION',
      taxableAmount: restaurantCommission,
      supplierState: 'J&K',
      recipientState: restaurantState,
    });

    const restaurantCommissionGst = 0.0;

    // Under Sec 9(5) ECO, Restaurant receives (Food Subtotal - Commission)
    const restaurantSettlement = Math.round(
      (foodSubtotal - restaurantCommission) * 100,
    ) / 100;

    // 6. Rider Payout (₹25 base + ₹6/km)
    const riderBasePay = config.riderBasePay;
    const riderDistancePay = Math.round(distanceKm * config.riderPerKmPay * 100) / 100;
    const riderTip = tipAmount; // 100% pass-through
    const totalRiderPayout = Math.round(
      (riderBasePay + riderDistancePay + config.riderWaitingPay + config.riderPeakBonus + config.riderLongDistanceBonus + config.riderBatchBonus + riderTip) * 100,
    ) / 100;

    // 7. Payment Gateway Internal Cost (Default 2% planning rate)
    const paymentGatewayCost = Math.round(customerTotal * (config.paymentGatewayPlanningRate / 100) * 100) / 100;

    // 8. Core Accounting Isolation
    const statutoryGstLiability = 0.0;
    const platformOperatingRevenue = Math.round(
      (restaurantCommission + platformFee + customerDeliveryFee) * 100,
    ) / 100;

    const riderDirectCost = totalRiderPayout - riderTip;
    const platformContributionMargin = Math.round((platformOperatingRevenue - riderDirectCost - paymentGatewayCost) * 100) / 100;

    return {
      foodSubtotal,
      customerDeliveryFee,
      platformFee,
      smallOrderFee: 0,
      packagingFee: 0,
      discountAmount,
      tipAmount,

      distanceKm,
      distanceType: 'HAVERSINE',
      deliveryEligible,
      deliveryRadiusKm,
      locationSource,

      taxItems,
      restaurantFoodGst: 0,
      platformFeeGst: 0,
      smallOrderFeeGst: 0,
      deliveryFeeGst: 0,
      totalCustomerTaxes: 0,
      customerTotal,

      restaurantCommissionPercent,
      restaurantCommission,
      restaurantCommissionGst: 0,
      restaurantSettlement,

      riderBasePay,
      riderDistancePay,
      riderTip,
      totalRiderPayout,

      paymentGatewayCost,
      statutoryGstLiability: 0,
      platformOperatingRevenue,
      platformContributionMargin,

      taxEngineVersion: '1.0.0-IN-GST-SEC9(5)',
      quoteTimestamp: new Date().toISOString(),
    };
  }
}
