import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Menu & Catalog (Phase 9)')
@Controller(['menus', 'categories'])
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  private getActor(req: any) {
    return {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
    };
  }

  // ==================================================
  // CATEGORY ENDPOINTS
  // ==================================================

  @Post(['categories', ''])
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new menu category' })
  async createCategory(
    @Body('restaurantId') restaurantId: string,
    @Body('name') name: string,
    @Body('displayOrder') displayOrder?: number,
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    const targetRestId = restaurantId || actor.restaurantId;
    return this.menusService.createCategory(
      targetRestId,
      name,
      displayOrder,
      actor,
    );
  }

  @Public()
  @Get(['categories', ''])
  @ApiOperation({ summary: 'Get all dynamic food categories across the platform' })
  async getAllCategories() {
    return this.menusService.getAllCategories();
  }

  @Public()
  @Get('categories/restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get all categories for a restaurant' })
  async getRestaurantCategories(
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.menusService.findCategoriesByRestaurant(restaurantId);
  }

  @Patch(['categories/:id', ':id'])
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('displayOrder') displayOrder?: number,
    @Body('isActive') isActive?: boolean,
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.updateCategory(
      id,
      name,
      displayOrder,
      isActive,
      actor,
    );
  }

  @Delete(['categories/:id', ':id'])
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string, @Request() req?: any) {
    const actor = this.getActor(req);
    return this.menusService.deleteCategory(id, actor);
  }

  @Post(['categories/reorder', 'reorder'])
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reorder categories' })
  async reorderCategories(
    @Body('categoryIds') categoryIds: string[],
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.reorderCategories(categoryIds, actor);
  }

  // ==================================================
  // FOOD ITEM ENDPOINTS
  // ==================================================

  @Post('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create food item' })
  async createItem(@Body() dto: any, @Request() req?: any) {
    const actor = this.getActor(req);
    if (!dto.restaurantId && actor.restaurantId) {
      dto.restaurantId = actor.restaurantId;
    }
    return this.menusService.createFoodItem(dto, actor);
  }

  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get restaurant menu' })
  async getRestaurantMenu(
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.menusService.findMenuByRestaurant(restaurantId);
  }

  @Patch('items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update food item' })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.updateFoodItem(id, dto, actor);
  }

  @Delete('items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete food item' })
  async deleteItem(@Param('id') id: string, @Request() req?: any) {
    const actor = this.getActor(req);
    return this.menusService.deleteFoodItem(id, actor);
  }

  @Post('items/:id/duplicate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Duplicate food item' })
  async duplicateItem(@Param('id') id: string, @Request() req?: any) {
    const actor = this.getActor(req);
    return this.menusService.duplicateFoodItem(id, actor);
  }

  @Patch('items/:id/availability')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle availability' })
  async updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.toggleAvailability(
      id,
      isAvailable,
      actor,
    );
  }

  // ==================================================
  // INDEPENDENT VARIANT ENDPOINTS
  // ==================================================

  @Post('items/:id/variants')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add variant to food item' })
  async addVariant(
    @Param('id') id: string,
    @Body() dto: { name: string; price: number; isAvailable?: boolean; displayOrder?: number },
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.addVariant(id, dto, actor);
  }

  @Patch('variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update variant price, name, or display order' })
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: { name?: string; price?: number; isAvailable?: boolean; displayOrder?: number },
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.updateVariant(variantId, dto, actor);
  }

  @Patch('variants/:variantId/availability')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle variant availability' })
  async toggleVariantAvailability(
    @Param('variantId') variantId: string,
    @Body('isAvailable') isAvailable: boolean,
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.toggleVariantAvailability(variantId, isAvailable, actor);
  }

  @Delete('variants/:variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a variant' })
  async deleteVariant(
    @Param('variantId') variantId: string,
    @Request() req?: any,
  ) {
    const actor = this.getActor(req);
    return this.menusService.deleteVariant(variantId, actor);
  }
}