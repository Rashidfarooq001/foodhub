import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Menu & Catalog (Phase 9)')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ==========================================
  // CATEGORY ENDPOINTS
  // ==========================================

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new menu category' })
  async createCategory(
    @Body('restaurantId') restaurantId: string,
    @Body('name') name: string,
    @Body('displayOrder') displayOrder?: number,
  ) {
    return this.menusService.createCategory(restaurantId, name, displayOrder);
  }

  @Public()
  @Get('categories/restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get all categories for a restaurant' })
  async getRestaurantCategories(@Param('restaurantId') restaurantId: string) {
    return this.menusService.findCategoriesByRestaurant(restaurantId);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Edit category details' })
  async updateCategory(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('displayOrder') displayOrder?: number,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.menusService.updateCategory(id, name, displayOrder, isActive);
  }

  @Delete('categories/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string) {
    return this.menusService.deleteCategory(id);
  }

  @Post('categories/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reorder categories by list of IDs' })
  async reorderCategories(@Body('categoryIds') categoryIds: string[]) {
    return this.menusService.reorderCategories(categoryIds);
  }

  // ==========================================
  // FOOD ITEM ENDPOINTS
  // ==========================================

  @Post('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new food item in menu' })
  async createItem(@Body() dto: any) {
    return this.menusService.createFoodItem(dto);
  }

  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get full menu catalog by restaurant ID' })
  async getRestaurantMenu(@Param('restaurantId') restaurantId: string) {
    return this.menusService.findMenuByRestaurant(restaurantId);
  }

  @Patch('items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update food item details' })
  async updateItem(@Param('id') id: string, @Body() dto: any) {
    return this.menusService.updateFoodItem(id, dto);
  }

  @Delete('items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete food item (Soft Delete)' })
  async deleteItem(@Param('id') id: string) {
    return this.menusService.deleteFoodItem(id);
  }

  @Post('items/:id/duplicate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Duplicate an existing food item' })
  async duplicateItem(@Param('id') id: string) {
    return this.menusService.duplicateFoodItem(id);
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
