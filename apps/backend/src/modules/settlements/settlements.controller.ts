import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Settlements (Phase 11)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get(['weekly', 'overview'])
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get authoritative restaurant-by-restaurant weekly settlements summary' })
  async getWeeklySettlements(
    @Query('periodType') periodType?: string,
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
  ) {
    return this.settlementsService.getWeeklyRestaurantSettlements(periodType || 'current', customStart, customEnd);
  }

  @Get('restaurant/:restaurantId/detail')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'RESTAURANT_OWNER')
  @ApiOperation({ summary: 'Get detailed order-level breakdown and bank account for a restaurant' })
  async getRestaurantDetail(
    @Param('restaurantId') restaurantId: string,
    @Query('periodType') periodType?: string,
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
    @CurrentUser() user?: any,
  ) {
    if (user?.role === 'RESTAURANT_OWNER') {
      const owns = user.restaurantId === restaurantId || (user.id && await this.settlementsService.verifyRestaurantOwner(restaurantId, user.id));
      if (!owns) {
        throw new ForbiddenException('Access denied. You can only view settlements for your own restaurant.');
      }
    }
    return this.settlementsService.getRestaurantSettlementDetail(restaurantId, periodType || 'current', customStart, customEnd);
  }

  @Post('restaurant/:restaurantId/payout')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Initiate bank payout for a restaurant with idempotency protection' })
  async initiatePayout(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: { periodType?: 'current' | 'previous' | 'custom'; customStart?: string; customEnd?: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.settlementsService.initiateRestaurantPayout(restaurantId, dto, user.id);
  }

  @Get('restaurant/:restaurantId/history')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'RESTAURANT_OWNER')
  @ApiOperation({ summary: 'Get historical weekly settlements for a restaurant' })
  async getRestaurantHistory(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user?: any,
  ) {
    if (user?.role === 'RESTAURANT_OWNER') {
      const owns = user.restaurantId === restaurantId || (user.id && await this.settlementsService.verifyRestaurantOwner(restaurantId, user.id));
      if (!owns) {
        throw new ForbiddenException('Access denied. You can only view settlement history for your own restaurant.');
      }
    }
    return this.settlementsService.getSettlementHistory(restaurantId);
  }

  @Get('reconciliation')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get double-entry mathematical reconciliation audit' })
  async getReconciliation(
    @Query('periodType') periodType?: 'current' | 'previous' | 'custom',
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
  ) {
    return this.settlementsService.getReconciliationReport(periodType || 'current', customStart, customEnd);
  }
}
