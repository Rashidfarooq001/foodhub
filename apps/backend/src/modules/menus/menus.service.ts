import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  async createCategory(restaurantId: string, name: string, displayOrder = 0) {
    return this.prisma.category.create({
      data: {
        restaurantId,
        name,
        displayOrder,
        isActive: true,
      },
    });
  }

  async findCategoriesByRestaurant(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      include: {
        foodItems: {
          where: { deletedAt: null },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateCategory(id: string, name?: string, displayOrder?: number, isActive?: boolean) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async deleteCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);

    return this.prisma.category.delete({ where: { id } });
  }

  async reorderCategories(categoryIds: string[]) {
    const updates = categoryIds.map((id, index) =>
      this.prisma.category.update({
        where: { id },
        data: { displayOrder: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  // ==========================================
  // FOOD ITEMS CRUD
  // ==========================================

  async createFoodItem(dto: any) {
    const {
      restaurantId,
      subCategoryId,
      name,
      description,
      price,
      imageUrl,
      isVeg = true,
      isAvailable = true,
      variants = [],
      addonGroups = [],
    } = dto;

    let targetCatId = dto.categoryId;
    if (targetCatId) {
      const catExists = await this.prisma.category.findUnique({ where: { id: targetCatId } });
      if (!catExists) targetCatId = null;
    }

    if (!targetCatId) {
      let firstCat = await this.prisma.category.findFirst({ where: { restaurantId } });
      if (!firstCat) {
        firstCat = await this.prisma.category.create({
          data: {
            restaurantId,
            name: 'Main Course',
            displayOrder: 0,
            isActive: true,
          },
        });
      }
      targetCatId = firstCat.id;
    }

    return this.prisma.foodItem.create({
      data: {
        restaurantId,
        categoryId: targetCatId,
        subCategoryId: subCategoryId || null,
        name,
        description,
        price,
        imageUrl,
        isVeg,
        isAvailable,
        ...(variants.length > 0 && {
          variants: {
            create: variants.map((v: any) => ({
              variantName: v.variantName || v.name,
              priceModifier: v.priceModifier || v.price || 0,
            })),
          },
        }),
        ...(addonGroups.length > 0 && {
          addonGroups: {
            create: addonGroups.map((g: any) => ({
              groupName: g.groupName || g.name,
              minSelect: g.minSelect || 0,
              maxSelect: g.maxSelect || 1,
              addons: {
                create: (g.addons || []).map((a: any) => ({
                 name: a.name || a.addonName,
                  price: a.price || 0,
                })),
              },
            })),
          },
        }),
      },
      include: {
        category: true,
        variants: true,
        addonGroups: { include: { addons: true } },
      },
    });
  }

  async updateFoodItem(id: string, dto: any) {
    const existing = await this.prisma.foodItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Food item ${id} not found`);

    const {
      name,
      description,
      price,
      imageUrl,
      isVeg,
      isAvailable,
      categoryId,
      subCategoryId,
    } = dto;

    return this.prisma.foodItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isVeg !== undefined && { isVeg }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(categoryId !== undefined && { categoryId }),
        ...(subCategoryId !== undefined && { subCategoryId }),
      },
      include: {
        category: true,
        variants: true,
        addonGroups: { include: { addons: true } },
      },
    });
  }

  async deleteFoodItem(id: string) {
    const item = await this.prisma.foodItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Food item ${id} not found`);

    // Soft delete food item
    return this.prisma.foodItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicateFoodItem(id: string) {
    const original = await this.prisma.foodItem.findUnique({
      where: { id },
      include: {
        variants: true,
        addonGroups: { include: { addons: true } },
      },
    });

    if (!original) throw new NotFoundException(`Food item ${id} not found`);

    return this.prisma.foodItem.create({
      data: {
        restaurantId: original.restaurantId,
        categoryId: original.categoryId,
        subCategoryId: original.subCategoryId,
        name: `${original.name} (Copy)`,
        description: original.description,
        price: original.price,
        imageUrl: original.imageUrl,
        isVeg: original.isVeg,
        isAvailable: original.isAvailable,
        ...(original.variants.length > 0 && {
          variants: {
            create: original.variants.map((v) => ({
              variantName: v.variantName,
              priceModifier: v.priceModifier,
            })),
          },
        }),
        ...(original.addonGroups.length > 0 && {
          addonGroups: {
            create: original.addonGroups.map((g) => ({
              groupName: g.groupName,
              minSelect: g.minSelect,
              maxSelect: g.maxSelect,
              addons: {
                create: g.addons.map((a) => ({
                 name: a.name,
                  price: a.price,
                })),
              },
            })),
          },
        }),
      },
      include: {
        category: true,
        variants: true,
        addonGroups: { include: { addons: true } },
      },
    });
  }

  async findMenuByRestaurant(restaurantId: string) {
    return this.prisma.foodItem.findMany({
      where: { restaurantId, deletedAt: null },
      include: {
        category: true,
        variants: true,
        addonGroups: { include: { addons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleAvailability(foodItemId: string, isAvailable: boolean) {
    const item = await this.prisma.foodItem.findUnique({
      where: { id: foodItemId },
    });
    if (!item) {
      throw new NotFoundException(`Food item ${foodItemId} not found`);
    }

    return this.prisma.foodItem.update({
      where: { id: foodItemId },
      data: { isAvailable },
    });
  }
}
