import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
  async findPendingApproval() {
    return this.restaurantsService.findPendingApprovalRestaurants();
  }

  @Get()
  @ApiOperation({ summary: 'List registered restaurants (Approved & Suspended)' })
  async findAll() {
    return this.restaurantsService.findAllRestaurants();
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
    @Body('status') status: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
  ) {
    return this.restaurantsService.updateVerificationStatus(id, status);
  }

  @Patch(':id/delivery-mode')
  @ApiOperation({ summary: 'Update restaurant delivery mode (FoodHub vs Self Delivery)' })
  async updateDeliveryMode(
    @Param('id') id: string,
    @Body('deliveryMode') deliveryMode: any,
  ) {
    return this.restaurantsService.updateDeliveryMode(id, deliveryMode);
  }

  @Get(':id/delivery-staff')
  @ApiOperation({ summary: 'List delivery staff for restaurant self delivery' })
  async getDeliveryStaff(@Param('id') id: string) {
    return this.restaurantsService.getDeliveryStaff(id);
  }

  @Post(':id/delivery-staff')
  @ApiOperation({ summary: 'Add a new self-delivery rider' })
  async createDeliveryStaff(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.restaurantsService.createDeliveryStaff(id, dto);
  }

  @Patch(':id/delivery-staff/:staffId')
  @ApiOperation({ summary: 'Update self-delivery rider details/status' })
  async updateDeliveryStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @Body() dto: any,
  ) {
    return this.restaurantsService.updateDeliveryStaff(id, staffId, dto);
  }

  @Delete(':id/delivery-staff/:staffId')
  @ApiOperation({ summary: 'Delete a self-delivery rider' })
  async deleteDeliveryStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
  ) {
    return this.restaurantsService.deleteDeliveryStaff(id, staffId);
  }

  @Get(':id/delivery-analytics')
  @ApiOperation({ summary: 'Get self-delivery performance metrics' })
  async getDeliveryAnalytics(@Param('id') id: string) {
    return this.restaurantsService.getDeliveryAnalytics(id);
  }
}
