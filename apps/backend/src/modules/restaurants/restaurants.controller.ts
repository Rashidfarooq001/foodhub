import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
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
}
