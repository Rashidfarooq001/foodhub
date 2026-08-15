import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { PricingService, PricingConfigDto } from './pricing.service';
import { UnitEconomicsService, OrderPricingRequest } from './unit-economics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly unitEconomicsService: UnitEconomicsService,
  ) {}

  @Get('config')
  async getPricingConfig() {
    return this.pricingService.getActivePricingConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('config')
  async updatePricingConfig(@Body() body: Partial<PricingConfigDto>) {
    return this.pricingService.updatePricingConfig(body);
  }

  @Post('calculate')
  async calculateOrderPricing(@Body() body: OrderPricingRequest) {
    return this.unitEconomicsService.calculateOrderPricing(body);
  }
}
