import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Menu & Catalog (Phase 9)')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new food item in menu' })
  async createItem(@Body() dto: CreateFoodItemDto) {
    return this.menusService.createFoodItem(dto);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get full menu catalog by restaurant ID' })
  async getRestaurantMenu(@Param('restaurantId') restaurantId: string) {
    return this.menusService.findMenuByRestaurant(restaurantId);
  }

  @Patch('items/:id/availability')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle in-stock / out-of-stock availability' })
  async updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.menusService.toggleAvailability(id, isAvailable);
  }
}
