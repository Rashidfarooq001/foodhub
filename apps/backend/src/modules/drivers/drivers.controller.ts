import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VehicleType } from '@prisma/client';

/**
 * VEHICLE TYPES CONFIG:
 * Sourced from the Prisma VehicleType enum — the database schema is the source
 * of truth for which vehicle types are supported. Frontends MUST call
 * GET /api/v1/drivers/vehicle-types to populate their dropdowns.
 * Never hardcode vehicle type lists in React components.
 */
const VEHICLE_TYPE_CONFIG: Array<{ code: VehicleType; name: string }> = [
  { code: VehicleType.MOTORCYCLE, name: 'Motorcycle / Bike' },
  { code: VehicleType.SCOOTER, name: 'Scooter' },
  { code: VehicleType.EV_SCOOTER, name: 'Electric Scooter (EV)' },
  { code: VehicleType.BICYCLE, name: 'Bicycle' },
];

@ApiTags('Delivery Drivers & Onboarding')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  /**
   * Returns the list of active vehicle types supported by FoodHub.
   * Frontends MUST use this endpoint to populate vehicle type dropdowns.
   * Source of truth: Prisma VehicleType enum (schema.prisma).
   */
  @Get('vehicle-types')
  @ApiOperation({ summary: 'Get supported vehicle types for registration forms' })
  getVehicleTypes() {
    return VEHICLE_TYPE_CONFIG;
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Super Admin direct driver creation' })
  async createByAdmin(@Body() dto: CreateDriverDto) {
    return this.driversService.createDriver(dto, true);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Delivery partner self-registration application' })
  async selfRegister(@Body() dto: CreateDriverDto) {
    return this.driversService.createDriver(dto, false);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered drivers' })
  async findAll() {
    return this.driversService.findAllDrivers();
  }

  @Get('applications')
  @ApiOperation({ summary: 'List pending driver onboarding applications' })
  async findApplications() {
    return this.driversService.findPendingApplications();
  }

  @Patch(':id/approval')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Approve or Reject/Suspend driver onboarding application' })
  async updateApproval(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ) {
    const adminUserId = req?.user?.id || req?.user?.sub;
    return this.driversService.updateApprovalStatus(id, isApproved, reason, adminUserId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete or remove delivery partner' })
  async deleteDriver(@Param('id') id: string, @Request() req?: any) {
    const adminUserId = req?.user?.id || req?.user?.sub;
    return this.driversService.deleteDriver(id, adminUserId);
  }
}
