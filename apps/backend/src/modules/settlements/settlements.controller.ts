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

@ApiTags('Settlements & Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get unified authoritative finance overview metrics' })
  async getFinanceOverview(
    @Query('periodType') periodType?: string,
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
  ) {
    return this.settlementsService.getFinanceOverview(periodType || 'current', customStart, customEnd);
  }

  @Get(['weekly', 'restaurants'])
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get authoritative restaurant-by-restaurant settlements summary' })
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

  @Post(['restaurant/:restaurantId/record-payment', 'restaurant/:restaurantId/payout'])
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Record manual settlement payment for a restaurant' })
  async recordRestaurantPayment(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: {
      amount: number;
      paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'OTHER';
      transactionReference: string;
      notes?: string;
      periodType?: string;
      customStart?: string;
      customEnd?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.settlementsService.recordRestaurantManualPayment(restaurantId, dto, user.id);
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

  @Get('riders')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get authoritative rider settlements summary' })
  async getRiderSettlements(
    @Query('periodType') periodType?: string,
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
  ) {
    return this.settlementsService.getRiderSettlements(periodType || 'current', customStart, customEnd);
  }

  @Get('rider/:driverId/detail')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get detailed delivery-level breakdown for a rider' })
  async getRiderDetail(
    @Param('driverId') driverId: string,
    @Query('periodType') periodType?: string,
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
  ) {
    return this.settlementsService.getRiderSettlementDetail(driverId, periodType || 'current', customStart, customEnd);
  }

  @Post('rider/:driverId/record-payment')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Record manual settlement payment for a delivery partner' })
  async recordRiderPayment(
    @Param('driverId') driverId: string,
    @Body() dto: {
      amount: number;
      paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'OTHER';
      transactionReference: string;
      notes?: string;
      periodType?: string;
      customStart?: string;
      customEnd?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.settlementsService.recordRiderManualPayment(driverId, dto, user.id);
  }

  @Get('transactions')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get unified transaction ledger' })
  async getTransactions(
    @Query('periodType') periodType?: string,
    @Query('customStart') customStart?: string,
    @Query('customEnd') customEnd?: string,
  ) {
    return this.settlementsService.getUnifiedTransactions(periodType || 'current', customStart, customEnd);
  }

  @Get('audit-logs')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get financial audit logs of manual settlement recordings' })
  async getAuditLogs() {
    return this.settlementsService.getFinancialAuditLogs();
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
