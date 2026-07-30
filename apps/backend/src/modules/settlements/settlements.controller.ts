import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Settlements (Phase 11)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get('pending')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'List all restaurants with pending settlement amounts' })
  async getPending() {
    return this.settlementsService.getPendingSettlements();
  }

  @Post('restaurant/:restaurantId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Process manual settlement for a restaurant' })
  async settleRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.settlementsService.processRestaurantSettlement(restaurantId);
  }

  @Get('restaurant/:restaurantId/history')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'RESTAURANT_OWNER')
  @ApiOperation({ summary: 'Get settlement history for a restaurant' })
  async restaurantHistory(@Param('restaurantId') restaurantId: string) {
    return this.settlementsService.getSettlementHistory(restaurantId);
  }

  @Post('driver/:driverId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Credit driver wallet for completed deliveries' })
  async settleDriver(@Param('driverId') driverId: string) {
    return this.settlementsService.processDriverSettlement(driverId);
  }
}
