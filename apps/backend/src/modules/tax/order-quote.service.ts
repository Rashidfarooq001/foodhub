import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
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

  distanceKm: number | null;
  etaMinutes: number | null;
  routeAvailable: boolean;
  serviceable: boolean;
  distanceType: 'MAPPLS_ROAD_ROUTING';
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

  // Authoritative Commission Snapshot
  commissionRate: number | null;
  commissionStatus: 'CONFIGURED' | 'UNCONFIGURED';
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

  // Authoritative Distance-Based Delivery Snapshot
  deliveryDistanceKm: number | null;
  deliveryFeeBaseKm: number;
  deliveryFeeBaseAmount: number;
  deliveryFeePerExtraKm: number;

  taxEngineVersion: string;
  quoteTimestamp: string;
}

@Injectable()
export class OrderQuoteService {
  constructor(
    private readonly prisma: PrismaService,
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

    // 1. Authoritative Distance & Radius Check via DistanceService (Backend Exclusive Authority)
    let distanceKm: number | null = null;
    let etaMinutes: number | null = null;
    let routeAvailable = false;
    let serviceable = false;
    let deliveryEligible = false;
    let deliveryRadiusKm = 15.0;
    const locationSource = req.locationSource || 'MANUAL_GEOCODED';

    let restaurantRecord: { id: string; commissionRate: any; deliveryRadius: any } | null = null;
    if (req.restaurantId) {
      restaurantRecord = await this.prisma.restaurant.findUnique({
        where: { id: req.restaurantId },
        select: { id: true, commissionRate: true, deliveryRadius: true },
      });
      if (restaurantRecord?.deliveryRadius) {
        deliveryRadiusKm = Number(restaurantRecord.deliveryRadius);
      }
    }

    if (req.restaurantId && typeof req.latitude === 'number' && typeof req.longitude === 'number') {
      const distRes = await this.distanceService.getDeliveryDistance(
        req.restaurantId,
        req.latitude,
        req.longitude,
      );
      
      if (!distRes.valid && distRes.reason === 'ROUTE_CALCULATION_FAILED') {
        throw new BadRequestException('Delivery route could not be calculated. The delivery service may be temporarily unavailable.');
      }
      if (!distRes.valid && (distRes.reason === 'INVALID_RESTAURANT_COORDINATES' || distRes.reason === 'INVALID_CUSTOMER_COORDINATES')) {
        throw new BadRequestException('Invalid coordinates provided for delivery calculation.');
      }
      
      distanceKm = distRes.distanceKm;
      etaMinutes = distRes.etaMinutes;
      routeAvailable = distRes.routeAvailable;
      serviceable = distRes.serviceable;
      deliveryEligible = distRes.valid;
      deliveryRadiusKm = distRes.radiusKm;
    }

    // 2. Authoritative Distance-Based Customer Delivery Fee Rule:
    // First 3 km: Base delivery fee = ₹15.00
    // After 3 km: Additional charge = ₹5.00 per additional KM
    // Formula: if (distance <= 3) deliveryFee = 15; else deliveryFee = 15 + ((distance - 3) * 5);
    const deliveryFeeBaseKm = 3.0;
    const deliveryFeeBaseAmount = 15.0;
    const deliveryFeePerExtraKm = 5.0;

    let customerDeliveryFee: number | null = null;
    if (routeAvailable && distanceKm !== null && distanceKm >= 0) {
      if (distanceKm <= deliveryFeeBaseKm) {
        customerDeliveryFee = deliveryFeeBaseAmount;
      } else {
        const extraKm = distanceKm - deliveryFeeBaseKm;
        customerDeliveryFee = Math.round((deliveryFeeBaseAmount + extraKm * deliveryFeePerExtraKm) * 100) / 100;
      }
    } else {
      customerDeliveryFee = 0; // Unresolved / 0 when route calculation is unavailable
    }

    if (!deliveryEligible || distanceKm === null || distanceKm > deliveryRadiusKm || !routeAvailable) {
      deliveryEligible = false;
      serviceable = false;
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

    // ==========================================
    // 6. AUTHORITATIVE COMMISSION RESOLUTION (13% on every individual order)
    // 1. Check Restaurant.commissionRate from DB
    // 2. Fallback to active PricingConfig.restaurantCommissionPercent
    // 3. Fallback to standard ZaykaFood platform rate: 13.0%
    // ==========================================
    let resolvedCommissionRate: number = 13.0;
    let commissionStatus: 'CONFIGURED' | 'UNCONFIGURED' = 'CONFIGURED';

    if (restaurantRecord && restaurantRecord.commissionRate !== null && restaurantRecord.commissionRate !== undefined) {
      resolvedCommissionRate = Number(restaurantRecord.commissionRate);
      commissionStatus = 'CONFIGURED';
    } else if (config.restaurantCommissionPercent !== null && config.restaurantCommissionPercent !== undefined) {
      resolvedCommissionRate = Number(config.restaurantCommissionPercent);
      commissionStatus = 'CONFIGURED';
    } else {
      resolvedCommissionRate = 13.0;
      commissionStatus = 'CONFIGURED';
    }

    const effectivePercent = resolvedCommissionRate;
    const restaurantCommission = Math.round(foodSubtotal * (effectivePercent / 100) * 100) / 100;
    // 18% GST on Commission (SAC 998314 - Merchant Platform Commission)
    const restaurantCommissionGst = Math.round(restaurantCommission * 0.18 * 100) / 100;

    // Under Sec 9(5) ECO, Restaurant receives:
    // Food Subtotal - Commission - GST on Commission
    const restaurantSettlement = Math.round(
      (foodSubtotal - restaurantCommission - restaurantCommissionGst) * 100,
    ) / 100;

    // 7. Rider Payout (₹25 base + ₹6/km)
    const riderBasePay = config.riderBasePay;
    const riderDistancePay = Math.round((distanceKm || 0) * config.riderPerKmPay * 100) / 100;
    const riderTip = tipAmount; // 100% pass-through
    const totalRiderPayout = Math.round(
      (riderBasePay + riderDistancePay + config.riderWaitingPay + config.riderPeakBonus + config.riderLongDistanceBonus + config.riderBatchBonus + riderTip) * 100,
    ) / 100;

    // 8. Payment Gateway Internal Cost (Default 2% planning rate)
    const paymentGatewayCost = Math.round(customerTotal * (config.paymentGatewayPlanningRate / 100) * 100) / 100;

    // 9. Core Accounting Isolation
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
      etaMinutes,
      routeAvailable,
      serviceable,
      distanceType: 'MAPPLS_ROAD_ROUTING',
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

      commissionRate: resolvedCommissionRate,
      commissionStatus,
      restaurantCommissionPercent: effectivePercent,
      restaurantCommission,
      restaurantCommissionGst,
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

      deliveryDistanceKm: distanceKm,
      deliveryFeeBaseKm,
      deliveryFeeBaseAmount,
      deliveryFeePerExtraKm,
    };
  }
}



