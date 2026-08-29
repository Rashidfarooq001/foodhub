const fs = require('fs');
const content = `import { Injectable, Logger } from '@nestjs/common';
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
  foodGstRate?: number;
  platformBrandTitle?: string;
}

export const DEFAULT_PRICING_CONFIG: PricingConfigDto = {
  restaurantCommissionPercent: 13.0,
  customerDeliveryPerKm: 5.0,
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
  foodGstRate: 5.0,
  platformBrandTitle: 'ZaykaFood',
};

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private cachedConfig: PricingConfigDto | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 10000; // 10 seconds for faster sync

  constructor(private readonly prisma: PrismaService) {}

  async getActivePricingConfig(): Promise<PricingConfigDto> {
    const now = Date.now();
    if (this.cachedConfig && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedConfig;
    }

    try {
      const [configRecord, taxRule, brandSetting] = await Promise.all([
        this.prisma.pricingConfig.findFirst({ orderBy: { createdAt: 'desc' } }),
        this.prisma.taxRule.findUnique({ where: { code: 'RESTAURANT_FOOD_SERVICE' } }),
        this.prisma.systemSetting.findUnique({ where: { key: 'PLATFORM_BRAND_TITLE' } }),
      ]);

      const baseConfig = configRecord ? {
        restaurantCommissionPercent: configRecord.restaurantCommissionPercent != null ? Number(configRecord.restaurantCommissionPercent) : null,
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
      } : DEFAULT_PRICING_CONFIG;

      this.cachedConfig = {
        ...baseConfig,
        foodGstRate: taxRule ? Number(taxRule.rate) : 5.0,
        platformBrandTitle: brandSetting ? brandSetting.value : 'ZaykaFood',
      };

      this.lastFetchTime = now;
      return this.cachedConfig;
    } catch (err: any) {
      this.logger.error(\`Error fetching PricingConfig: \${err.message}\`);
      return DEFAULT_PRICING_CONFIG;
    }
  }

  async updatePricingConfig(dto: Partial<PricingConfigDto>, userId?: string): Promise<PricingConfigDto> {
    const current = await this.getActivePricingConfig();
    const updated: PricingConfigDto = {
      ...current,
      ...dto
    };

    // 1. Save core pricing
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

    // 2. Save GST Tax Rule if changed
    if (dto.foodGstRate !== undefined && dto.foodGstRate !== current.foodGstRate) {
      await this.prisma.taxRule.updateMany({
        where: { code: 'RESTAURANT_FOOD_SERVICE' },
        data: { rate: dto.foodGstRate }
      });
    }

    // 3. Save System Setting for Brand Title if changed
    if (dto.platformBrandTitle !== undefined && dto.platformBrandTitle !== current.platformBrandTitle) {
      await this.prisma.systemSetting.upsert({
        where: { key: 'PLATFORM_BRAND_TITLE' },
        update: { value: dto.platformBrandTitle },
        create: { key: 'PLATFORM_BRAND_TITLE', value: dto.platformBrandTitle }
      });
    }

    this.cachedConfig = updated;
    this.lastFetchTime = Date.now();
    return updated;
  }
}
`;
fs.writeFileSync('apps/backend/src/modules/pricing/pricing.service.ts', content);
console.log('Successfully updated pricing.service.ts');
