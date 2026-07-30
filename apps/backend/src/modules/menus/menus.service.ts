import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFoodItemDto } from './dto/create-food-item.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async createFoodItem(dto: CreateFoodItemDto) {
    return this.prisma.foodItem.create({
      data: {
        restaurantId: dto.restaurantId,
        categoryId:   dto.categoryId,
        name:         dto.name,
        description:  dto.description,
        price:        dto.price,
        isVeg:        dto.isVeg,
        isAvailable:  true,
      },
    });
  }

  async findMenuByRestaurant(restaurantId: string) {
    return this.prisma.foodItem.findMany({
      where:   { restaurantId, deletedAt: null },
      include: {
        category:    true,
        variants:    true,
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
      data:  { isAvailable },
    });
  }
}
