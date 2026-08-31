import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Restaurants & Onboarding (Phase 8)')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit new restaurant registration application' })
  @ApiResponse({ status: 201, description: 'Registration submitted successfully' })
  async create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.createRestaurant(dto);
  }

  @Get('approval')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List pending restaurant applications requiring approval (Admin Only)' })
  async findPendingApproval(@Query('status') status?: string) {
    return this.restaurantsService.findPendingApprovalRestaurants(status);
  }

  @Get('applications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List all restaurant applications by status filter (Admin Only)' })
  async getApplications(@Query('status') status?: string) {
    return this.restaurantsService.findPendingApprovalRestaurants(status);
  }

  @Get()
  @ApiOperation({ summary: 'List registered restaurants (Approved only for public)' })
  async findAll(
    @Query('admin') admin?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;
    return this.restaurantsService.findAllRestaurants(admin === 'true', userLat, userLng);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant details by ID' })
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findRestaurantById(id);
  }

  @Patch(':id/approval')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Approve or Reject restaurant onboarding (Admin Only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
    @Body('rejectionReason') rejectionReason?: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.restaurantsService.updateVerificationStatus(id, status, rejectionReason, currentUser?.id);
  }

  @Patch(':id/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Approve or Reject restaurant onboarding alias (Admin Only)' })
  async verifyStatus(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
    @Body('rejectionReason') rejectionReason?: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.restaurantsService.updateVerificationStatus(id, status, rejectionReason, currentUser?.id);
  }

  @Patch(':id/suspend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Suspend a restaurant (Admin Only)' })
  async suspendRestaurant(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.restaurantsService.suspendRestaurant(id, reason, currentUser?.id);
  }

  @Patch(':id/reactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Reactivate a suspended restaurant (Admin Only)' })
  async reactivateRestaurant(
    @Param('id') id: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.restaurantsService.reactivateRestaurant(id, currentUser?.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Permanently delete a restaurant (Admin Only)' })
  async deleteRestaurant(
    @Param('id') id: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.restaurantsService.permanentlyDeleteRestaurant(id, currentUser?.id);
  }

  @Patch(':id/delivery-mode')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update restaurant delivery mode (FoodHub vs Self Delivery)' })
  async updateDeliveryMode(
    @Param('id') id: string,
    @Body('deliveryMode') deliveryMode: any,
    @CurrentUser() user: any,
  ) {
    await this.restaurantsService.verifyRestaurantAccess(id, user);
    return this.restaurantsService.updateDeliveryMode(id, deliveryMode);
  }

  @Patch(':id/commission')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update restaurant commission rate (Admin Only)' })
  async updateCommissionRate(
    @Param('id') id: string,
    @Body('commissionRate') commissionRate: number | null,
    @CurrentUser() currentUser?: any,
  ) {
    return this.restaurantsService.updateCommissionRate(id, commissionRate, currentUser?.id);
  }

  @Patch(':id/delivery-radius')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update restaurant delivery radius in km (Admin Only)' })
  async updateDeliveryRadius(
    @Param('id') id: string,
    @Body('deliveryRadius') deliveryRadius: number,
  ) {
    return this.restaurantsService.updateDeliveryRadius(id, deliveryRadius);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Generic restaurant update handler for status, commission, radius (Admin Only)' })
  async patchRestaurant(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() currentUser?: any,
  ) {
    if (body.status) {
      return this.restaurantsService.updateVerificationStatus(id, body.status, body.rejectionReason, currentUser?.id);
    }
    if (body.commissionRate !== undefined) {
      return this.restaurantsService.updateCommissionRate(id, body.commissionRate, currentUser?.id);
    }
    if (body.deliveryRadius !== undefined) {
      return this.restaurantsService.updateDeliveryRadius(id, body.deliveryRadius);
    }
    if (body.deliveryMode !== undefined) {
      return this.restaurantsService.updateDeliveryMode(id, body.deliveryMode);
    }
    return this.restaurantsService.findRestaurantById(id);
  }

  @Get(':id/delivery-staff')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List delivery staff for restaurant self delivery' })
  async getDeliveryStaff(@Param('id') id: string, @CurrentUser() user: any) {
    await this.restaurantsService.verifyRestaurantAccess(id, user);
    return this.restaurantsService.getDeliveryStaff(id);
  }

  @Post(':id/delivery-staff')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Add a new self-delivery rider' })
  async createDeliveryStaff(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    await this.restaurantsService.verifyRestaurantAccess(id, user);
    return this.restaurantsService.createDeliveryStaff(id, dto);
  }

  @Patch(':id/delivery-staff/:staffId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update self-delivery rider details/status' })
  async updateDeliveryStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    await this.restaurantsService.verifyRestaurantAccess(id, user);
    return this.restaurantsService.updateDeliveryStaff(id, staffId, dto);
  }

  @Delete(':id/delivery-staff/:staffId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a self-delivery rider' })
  async deleteDeliveryStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: any,
  ) {
    await this.restaurantsService.verifyRestaurantAccess(id, user);
    return this.restaurantsService.deleteDeliveryStaff(id, staffId);
  }

  @Get(':id/delivery-analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get self-delivery performance metrics' })
  async getDeliveryAnalytics(@Param('id') id: string, @CurrentUser() user: any) {
    await this.restaurantsService.verifyRestaurantAccess(id, user);
    return this.restaurantsService.getDeliveryAnalytics(id);
  }
}
