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

    // 2. Authoritative Delivery Fee Formula
    // 0–3 km: ₹30 flat fee. >3 km to 15 km: ₹30 + ₹5 × (distanceKm - 3). >15 km: Delivery unavailable (₹0).
    let customerDeliveryFee = 0;

    if (!deliveryEligible || distanceKm > 15.0) {
      deliveryEligible = false;
      customerDeliveryFee = 0;
    } else if (distanceKm <= 3.0) {
      customerDeliveryFee = 30.0;
    } else {
      customerDeliveryFee = Math.round((30.0 + (distanceKm - 3.0) * 5.0) * 100) / 100;
    }

    // 3. Platform Fee & Small Order Fee (Threshold: ₹200, Surcharge: ₹15)
    const platformFee = config.platformFee;
    const smallOrderFee = foodSubtotal > 0 && foodSubtotal < config.smallOrderThreshold ? config.smallOrderFee : 0;

    // 4. Tax Components
    const foodTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RESTAURANT_FOOD_SERVICE',
      taxableAmount: foodSubtotal,
      supplierState: restaurantState,
      recipientState: customerState,
    });

    const platformTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'PLATFORM_FEE',
      taxableAmount: platformFee,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const smallOrderTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'SMALL_ORDER_FEE',
      taxableAmount: smallOrderFee,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const deliveryTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'DELIVERY_SERVICE',
      taxableAmount: customerDeliveryFee,
      supplierState: 'J&K',
      recipientState: customerState,
    });

    const tipTax = await this.taxEngine.calculateTaxComponent({
      componentCode: 'RIDER_TIP',
      taxableAmount: tipAmount,
      supplierState: customerState,
      recipientState: customerState,
    });

    const taxItems: TaxComponentOutput[] = [foodTax, platformTax, smallOrderTax, deliveryTax, tipTax];

    const restaurantFoodGst = foodTax.totalTax;
    const platformFeeGst = platformTax.totalTax;
    const smallOrderFeeGst = smallOrderTax.totalTax;
    const deliveryFeeGst = deliveryTax.totalTax;

    const totalCustomerTaxes = Math.round(
      (restaurantFoodGst + platformFeeGst + smallOrderFeeGst + deliveryFeeGst) * 100,
    ) / 100;

    // 5. Customer Total (NO PACKAGING FEE INCLUDED)
    const customerTotal = Math.max(
      0,
      Math.round(
        (foodSubtotal + customerDeliveryFee + platformFee + smallOrderFee + totalCustomerTaxes + tipAmount - discountAmount) * 100,
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

    const restaurantCommissionGst = commissionTax.totalTax;

    // Under Sec 9(5) ECO, FoodHub remits restaurant food GST to govt. Restaurant receives (Food + Packaging - Commission - CommissionGST)
    const restaurantSettlement = Math.round(
      (foodSubtotal + packagingFee - restaurantCommission - restaurantCommissionGst) * 100,
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

    // 8. Core Accounting Isolation (Government GST is EXCLUDED from FoodHub operating profit!)
    const statutoryGstLiability = Math.round((restaurantFoodGst + platformFeeGst + smallOrderFeeGst + deliveryFeeGst) * 100) / 100;
    const platformOperatingRevenue = Math.round(
      (restaurantCommission + platformFee + smallOrderFee + customerDeliveryFee) * 100,
    ) / 100;

    const riderDirectCost = totalRiderPayout - riderTip;
    const platformContributionMargin = Math.round((platformOperatingRevenue - riderDirectCost - paymentGatewayCost) * 100) / 100;

    return {
      foodSubtotal,
      customerDeliveryFee,
      platformFee,
      smallOrderFee,
      packagingFee,
      discountAmount,
      tipAmount,

      distanceKm,
      distanceType: 'HAVERSINE',
      deliveryEligible,
      deliveryRadiusKm,
      locationSource,

      taxItems,
      restaurantFoodGst,
      platformFeeGst,
      smallOrderFeeGst,
      deliveryFeeGst,
      totalCustomerTaxes,
      customerTotal,

      restaurantCommissionPercent,
      restaurantCommission,
      restaurantCommissionGst,
      restaurantSettlement,

      riderBasePay,
      riderDistancePay,
      riderTip,
      totalRiderPayout,

      paymentGatewayCost,
      statutoryGstLiability,
      platformOperatingRevenue,
      platformContributionMargin,

      taxEngineVersion: '1.0.0-IN-GST-SEC9(5)',
      quoteTimestamp: new Date().toISOString(),
    };
  }
}
