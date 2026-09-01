import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Coupons (Phase 15)')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active platform coupons' })
  async listActive() {
    return [];
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code and preview discount amount' })
  async validate(@Request() req: any, @Body() dto: ValidateCouponDto) {
    return {
      valid: false,
      discountAmount: 0,
      message: 'Coupons and promotional discounts are not supported on Zayka Food.',
    };
  }

  @Get('suggest')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Suggest the best available coupon for a given subtotal' })
  @ApiQuery({ name: 'subtotal', description: 'Order subtotal in ₹' })
  async suggest() {
    return null;
  }

  // ---- Admin-only routes ----

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: Create a new coupon' })
  async create(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: Deactivate a coupon' })
  async deactivate(@Param('id') id: string) {
    return this.couponsService.deactivateCoupon(id);
  }
}
