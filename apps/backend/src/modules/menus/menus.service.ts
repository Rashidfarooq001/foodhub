import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { serializePrisma } from '../../common/utils/serializer.util';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to verify that the requesting user owns or manages the restaurant.
   */
  async verifyRestaurantOwnership(restaurantId: string, actor: { userId?: string; role?: string; restaurantId?: string }) {
    if (!actor || !actor.userId) {
      throw new ForbiddenException('Authentication required to modify menu catalog.');
    }
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') {
      return; // Admins have full access
    }

    if (actor.restaurantId && actor.restaurantId === restaurantId) {
      return; // Matches assigned staff restaurant
    }

    if (actor.userId) {
      const rest = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { ownerId: true },
      });
      if (rest && rest.ownerId === actor.userId) {
        return; // Verified restaurant owner
      }

      // Also check RestaurantStaff table
      const staffLink = await this.prisma.restaurantStaff.findFirst({
        where: {
          restaurantId,
          userId: actor.userId,
        },
      });
      if (staffLink) {
        return; // Verified restaurant staff
      }
    }

    throw new ForbiddenException('Access denied. You do not own or manage this restaurant catalog.');
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  async createCategory(restaurantId: string, name: string, displayOrder = 0, actor?: any) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Category name is required.');
    }
    if (actor) {
      await this.verifyRestaurantOwnership(restaurantId, actor);
    }
    const res = await this.prisma.category.create({
      data: {
        restaurantId,
        name: name.trim(),
        displayOrder,
        isActive: true,
      },
    });
    return serializePrisma(res);
  }

  async findCategoriesByRestaurant(restaurantId: string) {
    const res = await this.prisma.category.findMany({
      where: { restaurantId },
      include: {
        foodItems: {
          where: { deletedAt: null },
          include: {
            variants: {
              orderBy: { displayOrder: 'asc' },
            },
            addonGroups: { include: { addons: true } },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
    return serializePrisma(res);
  }

  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { foodItems: { where: { deletedAt: null } } } },
        foodItems: {
          where: { deletedAt: null },
          select: { imageUrl: true },
          take: 1,
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const categoryMap = new Map<string, { id: string; name: string; image: string; itemCount: number }>();

    for (const cat of categories) {
      const normalizedName = cat.name.trim();
      const existing = categoryMap.get(normalizedName);
      const firstImage = cat.foodItems[0]?.imageUrl || '';

      if (!existing) {
        categoryMap.set(normalizedName, {
          id: cat.id,
          name: normalizedName,
          image: firstImage || '',
          itemCount: cat._count.foodItems,
        });
      } else {
        existing.itemCount += cat._count.foodItems;
        if (!existing.image && firstImage) {
          existing.image = firstImage;
        }
      }
    }

    return serializePrisma(Array.from(categoryMap.values()));
  }

  async updateCategory(id: string, name?: string, displayOrder?: number, isActive?: boolean, actor?: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(cat.restaurantId, actor);
    }

    const res = await this.prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return serializePrisma(res);
  }

  async deleteCategory(id: string, actor?: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(cat.restaurantId, actor);
    }

    const res = await this.prisma.category.delete({ where: { id } });
    return serializePrisma(res);
  }

  async reorderCategories(categoryIds: string[], actor?: any) {
    if (!categoryIds || categoryIds.length === 0) return [];
    
    if (actor) {
      const firstCat = await this.prisma.category.findUnique({ where: { id: categoryIds[0] } });
      if (firstCat) {
        await this.verifyRestaurantOwnership(firstCat.restaurantId, actor);
      }
    }

    const updates = categoryIds.map((id, index) =>
      this.prisma.category.update({
        where: { id },
        data: { displayOrder: index },
      }),
    );
    const res = await this.prisma.$transaction(updates);
    return serializePrisma(res);
  }

  // ==========================================
  // FOOD ITEMS & VARIANTS CRUD
  // ==========================================

  async createFoodItem(dto: any, actor?: any) {
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

    if (!name || !name.trim()) {
      throw new BadRequestException('Food item name is required.');
    }

    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required.');
    }

    if (actor) {
      await this.verifyRestaurantOwnership(restaurantId, actor);
    }

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

    // Clean and validate variants
    const processedVariants = (variants || []).map((v: any, idx: number) => {
      const vName = v.variantName || v.name || 'Standard';
      const vPrice = Number(v.price !== undefined ? v.price : (v.priceModifier !== undefined ? v.priceModifier : price || 0));
      return {
        variantName: vName.trim(),
        price: vPrice,
        priceModifier: vPrice,
        isAvailable: v.isAvailable !== false,
        displayOrder: v.displayOrder !== undefined ? v.displayOrder : idx,
      };
    });

    const basePrice = processedVariants.length > 0 ? processedVariants[0].price : Number(price || 0);

    const res = await this.prisma.foodItem.create({
      data: {
        restaurantId,
        categoryId: targetCatId,
        subCategoryId: subCategoryId || null,
        name: name.trim(),
        description: description || null,
        price: basePrice,
        imageUrl: imageUrl || null,
        isVeg,
        isAvailable,
        ...(processedVariants.length > 0 && {
          variants: {
            create: processedVariants,
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
                  price: Number(a.price || 0),
                })),
              },
            })),
          },
        }),
      },
      include: {
        category: true,
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
        addonGroups: { include: { addons: true } },
      },
    });

    return serializePrisma(res);
  }

  async updateFoodItem(id: string, dto: any, actor?: any) {
    const existing = await this.prisma.foodItem.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing) throw new NotFoundException(`Food item ${id} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(existing.restaurantId, actor);
    }

    const {
      name,
      description,
      price,
      imageUrl,
      isVeg,
      isAvailable,
      categoryId,
      subCategoryId,
      variants,
    } = dto;

    // Handle variant replacements if explicitly provided
    if (variants !== undefined && Array.isArray(variants)) {
      await this.prisma.foodVariant.deleteMany({ where: { foodItemId: id } });
      if (variants.length > 0) {
        await this.prisma.foodVariant.createMany({
          data: variants.map((v: any, idx: number) => {
            const vPrice = Number(v.price !== undefined ? v.price : (v.priceModifier !== undefined ? v.priceModifier : 0));
            return {
              foodItemId: id,
              variantName: (v.variantName || v.name || `Variant ${idx + 1}`).trim(),
              price: vPrice,
              priceModifier: vPrice,
              isAvailable: v.isAvailable !== false,
              displayOrder: v.displayOrder !== undefined ? v.displayOrder : idx,
            };
          }),
        });
      }
    }

    const res = await this.prisma.foodItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isVeg !== undefined && { isVeg }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(categoryId !== undefined && { categoryId }),
        ...(subCategoryId !== undefined && { subCategoryId }),
      },
      include: {
        category: true,
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
        addonGroups: { include: { addons: true } },
      },
    });

    return serializePrisma(res);
  }

  async deleteFoodItem(id: string, actor?: any) {
    const item = await this.prisma.foodItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Food item ${id} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(item.restaurantId, actor);
    }

    const res = await this.prisma.foodItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return serializePrisma(res);
  }

  async duplicateFoodItem(id: string, actor?: any) {
    const original = await this.prisma.foodItem.findUnique({
      where: { id },
      include: {
        variants: true,
        addonGroups: { include: { addons: true } },
      },
    });

    if (!original) throw new NotFoundException(`Food item ${id} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(original.restaurantId, actor);
    }

    const res = await this.prisma.foodItem.create({
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
              price: v.price,
              priceModifier: v.priceModifier,
              isAvailable: v.isAvailable,
              displayOrder: v.displayOrder,
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
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
        addonGroups: { include: { addons: true } },
      },
    });

    return serializePrisma(res);
  }

  async findMenuByRestaurant(restaurantId: string) {
    const res = await this.prisma.foodItem.findMany({
      where: { restaurantId, deletedAt: null },
      include: {
        category: true,
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
        addonGroups: { include: { addons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return serializePrisma(res);
  }

  async toggleAvailability(foodItemId: string, isAvailable: boolean, actor?: any) {
    const item = await this.prisma.foodItem.findUnique({
      where: { id: foodItemId },
    });
    if (!item) {
      throw new NotFoundException(`Food item ${foodItemId} not found`);
    }

    if (actor) {
      await this.verifyRestaurantOwnership(item.restaurantId, actor);
    }

    const res = await this.prisma.foodItem.update({
      where: { id: foodItemId },
      data: { isAvailable },
      include: {
        variants: true,
      },
    });

    return serializePrisma(res);
  }

  // ==========================================
  // INDEPENDENT VARIANT MANAGEMENT
  // ==========================================

  async addVariant(foodItemId: string, dto: { name: string; price: number; isAvailable?: boolean; displayOrder?: number }, actor?: any) {
    const foodItem = await this.prisma.foodItem.findUnique({ where: { id: foodItemId } });
    if (!foodItem) throw new NotFoundException(`Food item ${foodItemId} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(foodItem.restaurantId, actor);
    }

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Variant name is required.');
    }

    const vPrice = Number(dto.price || 0);

    const variant = await this.prisma.foodVariant.create({
      data: {
        foodItemId,
        variantName: dto.name.trim(),
        price: vPrice,
        priceModifier: vPrice,
        isAvailable: dto.isAvailable !== false,
        displayOrder: dto.displayOrder || 0,
      },
    });

    return serializePrisma(variant);
  }

  async updateVariant(variantId: string, dto: { name?: string; price?: number; isAvailable?: boolean; displayOrder?: number }, actor?: any) {
    const variant = await this.prisma.foodVariant.findUnique({
      where: { id: variantId },
      include: { foodItem: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(variant.foodItem.restaurantId, actor);
    }

    const updated = await this.prisma.foodVariant.update({
      where: { id: variantId },
      data: {
        ...(dto.name !== undefined && { variantName: dto.name.trim() }),
        ...(dto.price !== undefined && { price: Number(dto.price), priceModifier: Number(dto.price) }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      },
    });

    return serializePrisma(updated);
  }

  async toggleVariantAvailability(variantId: string, isAvailable: boolean, actor?: any) {
    const variant = await this.prisma.foodVariant.findUnique({
      where: { id: variantId },
      include: { foodItem: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(variant.foodItem.restaurantId, actor);
    }

    const res = await this.prisma.foodVariant.update({
      where: { id: variantId },
      data: { isAvailable },
    });

    return serializePrisma(res);
  }

  async deleteVariant(variantId: string, actor?: any) {
    const variant = await this.prisma.foodVariant.findUnique({
      where: { id: variantId },
      include: { foodItem: true },
    });
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

    if (actor) {
      await this.verifyRestaurantOwnership(variant.foodItem.restaurantId, actor);
    }

    const res = await this.prisma.foodVariant.delete({
      where: { id: variantId },
    });

    return serializePrisma(res);
  }
}
