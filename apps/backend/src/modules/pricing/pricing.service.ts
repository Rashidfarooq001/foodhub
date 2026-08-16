import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface PricingConfigDto {
  restaurantCommissionPercent: number | null;
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

export const DEFAULT_PRICING_CONFIG: PricingConfigDto = {
  restaurantCommissionPercent: null, // UNCONFIGURED by default
  customerDeliveryPerKm: 0.0,
  minimumCustomerDeliveryFee: 15.0,
  platformFee: 3.0,
  smallOrderThreshold: 0.0,
  smallOrderFee: 0.0,
  riderBasePay: 25.0,
  riderPerKmPay: 6.0,
  riderWaitingPay: 0.0,
  riderPeakBonus: 0.0,
  riderLongDistanceBonus: 0.0,
  riderBatchBonus: 0.0,
  paymentGatewayPlanningRate: 2.0,
};

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private cachedConfig: PricingConfigDto | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute in-memory cache

  constructor(private readonly prisma: PrismaService) {}

  async getActivePricingConfig(): Promise<PricingConfigDto> {
    const now = Date.now();
    if (this.cachedConfig && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedConfig;
    }

    try {
      const configRecord = await this.prisma.pricingConfig.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!configRecord) {
        this.cachedConfig = DEFAULT_PRICING_CONFIG;
        this.lastFetchTime = now;
        return DEFAULT_PRICING_CONFIG;
      }

      this.cachedConfig = {
        restaurantCommissionPercent: configRecord.restaurantCommissionPercent != null
          ? Number(configRecord.restaurantCommissionPercent)
          : null,
        customerDeliveryPerKm: Number(configRecord.customerDeliveryPerKm),
        minimumCustomerDeliveryFee: Number(configRecord.minimumCustomerDeliveryFee),
        platformFee: Number(configRecord.platformFee),
        smallOrderThreshold: Number(configRecord.smallOrderThreshold),
        smallOrderFee: Number(configRecord.smallOrderFee),
        riderBasePay: Number(configRecord.riderBasePay),
        riderPerKmPay: Number(configRecord.riderPerKmPay),
        riderWaitingPay: Number(configRecord.riderWaitingPay),
        riderPeakBonus: Number(configRecord.riderPeakBonus),
        riderLongDistanceBonus: Number(configRecord.riderLongDistanceBonus),
        riderBatchBonus: Number(configRecord.riderBatchBonus),
        paymentGatewayPlanningRate: Number(configRecord.paymentGatewayPlanningRate ?? 2.0),
      };

      this.lastFetchTime = now;
      return this.cachedConfig;
    } catch (err: any) {
      this.logger.error(`Error fetching PricingConfig from PostgreSQL: ${err.message}`);
      return DEFAULT_PRICING_CONFIG;
    }
  }

  async updatePricingConfig(dto: Partial<PricingConfigDto>, userId?: string): Promise<PricingConfigDto> {
    const current = await this.getActivePricingConfig();
    const updated: PricingConfigDto = {
      restaurantCommissionPercent: dto.restaurantCommissionPercent !== undefined
        ? dto.restaurantCommissionPercent
        : current.restaurantCommissionPercent,
      customerDeliveryPerKm: dto.customerDeliveryPerKm ?? current.customerDeliveryPerKm,
      minimumCustomerDeliveryFee: dto.minimumCustomerDeliveryFee ?? current.minimumCustomerDeliveryFee,
      platformFee: dto.platformFee ?? current.platformFee,
      smallOrderThreshold: dto.smallOrderThreshold ?? current.smallOrderThreshold,
      smallOrderFee: dto.smallOrderFee ?? current.smallOrderFee,
      riderBasePay: dto.riderBasePay ?? current.riderBasePay,
      riderPerKmPay: dto.riderPerKmPay ?? current.riderPerKmPay,
      riderWaitingPay: dto.riderWaitingPay ?? current.riderWaitingPay,
      riderPeakBonus: dto.riderPeakBonus ?? current.riderPeakBonus,
      riderLongDistanceBonus: dto.riderLongDistanceBonus ?? current.riderLongDistanceBonus,
      riderBatchBonus: dto.riderBatchBonus ?? current.riderBatchBonus,
      paymentGatewayPlanningRate: dto.paymentGatewayPlanningRate ?? current.paymentGatewayPlanningRate,
    };

    const newRecord = await this.prisma.pricingConfig.create({
      data: {
        restaurantCommissionPercent: updated.restaurantCommissionPercent,
        customerDeliveryPerKm: updated.customerDeliveryPerKm,
        minimumCustomerDeliveryFee: updated.minimumCustomerDeliveryFee,
        platformFee: updated.platformFee,
        smallOrderThreshold: updated.smallOrderThreshold,
        smallOrderFee: updated.smallOrderFee,
        riderBasePay: updated.riderBasePay,
        riderPerKmPay: updated.riderPerKmPay,
        riderWaitingPay: updated.riderWaitingPay,
        riderPeakBonus: updated.riderPeakBonus,
        riderLongDistanceBonus: updated.riderLongDistanceBonus,
        riderBatchBonus: updated.riderBatchBonus,
        paymentGatewayPlanningRate: updated.paymentGatewayPlanningRate,
        createdBy: userId || 'ADMIN',
        updatedBy: userId || 'ADMIN',
        isDefault: false,
      },
    });

    await this.prisma.pricingConfigAuditLog.create({
      data: {
        configId: newRecord.id,
        changedBy: userId || 'ADMIN',
        previousValue: current as any,
        newValue: updated as any,
        reason: 'Central Pricing Configuration Update from Admin Dashboard',
      },
    });

    this.cachedConfig = updated;
    this.lastFetchTime = Date.now();
    return updated;
  }
}
