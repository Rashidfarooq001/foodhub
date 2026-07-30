import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Delivery Drivers & Onboarding')
@Controller('api/v1/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

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
  @ApiOperation({ summary: 'Approve or Reject driver onboarding application' })
  async updateApproval(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    return this.driversService.updateApprovalStatus(id, isApproved);
  }
}
