import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantStatus, UserRole, DeliveryMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { serializePrisma } from '../../common/utils/serializer.util';
const isUUID = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRestaurant(dto: CreateRestaurantDto) {
    const rawPassword = dto.password || 'RestaurantPass123!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const phone =
      dto.phone ||
      `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const email = dto.email || `owner_${Date.now()}@foodhub.com`;
    const ownerName = dto.ownerName || dto.name + ' Owner';

    // Execute atomic transaction for User, Profile, Restaurant, and Staff linkage
    const result = await this.prisma.$transaction(async (tx) => {
      let ownerId = dto.ownerId;

      if (ownerId) {
        // Update existing user role to RESTAURANT_OWNER
        await tx.user.update({
          where: { id: ownerId },
          data: {
            role: UserRole.RESTAURANT_OWNER,
            isVerified: true,
            isActive: true,
          },
        });
      } else {
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [{ phone }, { email }],
          },
        });

        if (existingUser) {
          ownerId = existingUser.id;
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              role: UserRole.RESTAURANT_OWNER,
              isVerified: true,
              isActive: true,
            },
          });
        } else {
          const nameParts = ownerName.split(' ');
          const newUser = await tx.user.create({
            data: {
              phone,
              email,
              passwordHash,
              role: UserRole.RESTAURANT_OWNER,
              isVerified: true,
              isActive: true,
              profile: {
                create: {
                  firstName: nameParts[0] || 'Owner',
                  lastName: nameParts.slice(1).join(' ') || '',
                },
              },
            },
          });
          ownerId = newUser.id;
        }
      }

      const slug =
        dto.name
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '') +
        '-' +
        Math.floor(Math.random() * 1000);

      const fullAddress = [
        dto.address,
        dto.city,
        dto.state,
        dto.pin,
        dto.country,
      ]
        .filter(Boolean)
        .join(', ');

      const restaurant = await tx.restaurant.create({
        data: {
          ownerId,
          name: dto.name,
          slug,
          phone: dto.phone || phone,
          email: dto.email || email,
          licenseFssai:
            dto.fssaiLicense ||
            `FSSAI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          gstin:
            dto.gstin ||
            `GST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          addressLine:
            fullAddress || dto.address || 'Bengaluru, India',
          latitude: dto.latitude || 12.9716,
          longitude: dto.longitude || 77.5946,
          bannerUrl: dto.bannerUrl,
          status: RestaurantStatus.PENDING_APPROVAL,
          isOpen: false,
        },
      });

      // Link owner in RestaurantStaff table
      await tx.restaurantStaff.upsert({
        where: {
          restaurantId_userId: {
            restaurantId: restaurant.id,
            userId: ownerId,
          },
        },
        update: { designation: 'Owner' },
        create: {
          restaurantId: restaurant.id,
          userId: ownerId,
          designation: 'Owner',
        },
      });

      return {
        restaurant,
        ownerId,
        phone,
        email,
        generatedPassword: rawPassword,
      };
    });

    return {
      ...result.restaurant,
      ownerCredentials: {
        phone: result.phone,
        email: result.email,
        password: result.generatedPassword,
        ownerId: result.ownerId,
      },
      avgRating: result.restaurant.avgRating
        ? Number(result.restaurant.avgRating)
        : 0,
      commissionRate: result.restaurant.commissionRate
        ? Number(result.restaurant.commissionRate)
        : 0,
    };
  }

  async findPendingApprovalRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        status: RestaurantStatus.PENDING_APPROVAL,
      },
      include: {
        categories: {
          include: {
            foodItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return restaurants.map((restaurant) => ({
      ...restaurant,
      avgRating: restaurant.avgRating
        ? Number(restaurant.avgRating)
        : 0,
      commissionRate: restaurant.commissionRate
        ? Number(restaurant.commissionRate)
        : 0,
    }));
  }

  async findAllRestaurants(adminView = false) {
    const whereCondition = adminView
      ? { status: { in: [RestaurantStatus.APPROVED, RestaurantStatus.SUSPENDED] } }
      : { status: RestaurantStatus.APPROVED };

    const restaurants = await this.prisma.restaurant.findMany({
      where: whereCondition,
      include: {
        categories: {
          include: {
            foodItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return serializePrisma(restaurants.map((restaurant) => ({
      ...restaurant,
      avgRating: restaurant.avgRating
        ? Number(restaurant.avgRating)
        : 0,
      commissionRate: restaurant.commissionRate
        ? Number(restaurant.commissionRate)
        : 0,
    })));
  }

  async findRestaurantById(idOrSlug: string) {
   const whereCondition = isUUID(idOrSlug)
  ? { id: idOrSlug }
  : { slug: idOrSlug };

const restaurant = await this.prisma.restaurant.findFirst({
  where: whereCondition,
      include: {
        categories: {
          include: {
            foodItems: {
              where: { deletedAt: null },
              include: {
                variants: true,
                addonGroups: { include: { addons: true } },
              },
            },
          },
        },
        foodItems: {
          where: { deletedAt: null },
          include: {
            variants: true,
            addonGroups: { include: { addons: true } },
          },
        },
        staff: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant ${idOrSlug} not found`,
      );
    }

    return serializePrisma({
      ...restaurant,
      avgRating: restaurant.avgRating
        ? Number(restaurant.avgRating)
        : 0,
      commissionRate: restaurant.commissionRate
        ? Number(restaurant.commissionRate)
        : 0,
    });
  }

  async updateVerificationStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
  ) {
    await this.findRestaurantById(id);

    const prismaStatus =
      status === 'APPROVED'
        ? RestaurantStatus.APPROVED
        : status === 'SUSPENDED'
        ? RestaurantStatus.SUSPENDED
        : status === 'REJECTED'
        ? RestaurantStatus.REJECTED
        : RestaurantStatus.PENDING_APPROVAL;

    const isOpen = prismaStatus === RestaurantStatus.APPROVED;

    const restaurant = await this.prisma.restaurant.update({
      where: {
        id,
      },
      data: {
        status: prismaStatus,
        isOpen,
      },
    });

    // Auto-activate and verify owner User account directly
    await this.prisma.user.update({
      where: { id: restaurant.ownerId },
      data: {
        isVerified: prismaStatus === RestaurantStatus.APPROVED,
        isActive: prismaStatus !== RestaurantStatus.REJECTED,
      },
    });

    // Ensure RestaurantStaff record exists
    await this.prisma.restaurantStaff.upsert({
      where: {
        restaurantId_userId: {
          restaurantId: id,
          userId: restaurant.ownerId,
        },
      },
      update: { designation: 'Owner' },
      create: {
        restaurantId: id,
        userId: restaurant.ownerId,
        designation: 'Owner',
      },
    });

    // Update any additional staff records
    const staffRecords = await this.prisma.restaurantStaff.findMany({
      where: { restaurantId: id },
    });

    for (const staff of staffRecords) {
      await this.prisma.user.update({
        where: { id: staff.userId },
        data: {
          isVerified: prismaStatus === RestaurantStatus.APPROVED,
          isActive: prismaStatus !== RestaurantStatus.REJECTED,
        },
      });
    }

    return {
      ...restaurant,
      avgRating: restaurant.avgRating
        ? Number(restaurant.avgRating)
        : 0,
      commissionRate: restaurant.commissionRate
        ? Number(restaurant.commissionRate)
        : 0,
    };
  }

  async updateDeliveryMode(id: string, deliveryMode: DeliveryMode) {
    await this.findRestaurantById(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { deliveryMode },
    });
  }

  async getDeliveryStaff(restaurantId: string) {
    const staff = await this.prisma.restaurantDeliveryStaff.findMany({
      where: { restaurantId },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalStaff = staff.length;
    const availableCount = staff.filter((s) => s.status === 'AVAILABLE' && s.isActive).length;
    const busyCount = staff.filter((s) => s.status === 'BUSY' && s.isActive).length;

    return {
      staff,
      summary: {
        totalStaff,
        availableCount,
        busyCount,
        offlineCount: totalStaff - availableCount - busyCount,
      },
    };
  }

  async createDeliveryStaff(restaurantId: string, dto: any) {
    return this.prisma.restaurantDeliveryStaff.create({
      data: {
        restaurantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        avatar: dto.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        vehicleType: dto.vehicleType || 'SCOOTER',
        vehicleNumber: dto.vehicleNumber || 'KA-01-HD-9999',
        status: 'AVAILABLE',
        isActive: true,
      },
    });
  }

  async updateDeliveryStaff(restaurantId: string, staffId: string, dto: any) {
    return this.prisma.restaurantDeliveryStaff.update({
      where: { id: staffId },
      data: dto,
    });
  }

  async deleteDeliveryStaff(restaurantId: string, staffId: string) {
    return this.prisma.restaurantDeliveryStaff.delete({
      where: { id: staffId },
    });
  }

  async getDeliveryAnalytics(restaurantId: string) {
    const staff = await this.prisma.restaurantDeliveryStaff.findMany({
      where: { restaurantId },
      include: {
        orders: true,
      },
    });

    const completedOrders = await this.prisma.order.count({
      where: {
        restaurantId,
        assignedRestaurantDriverId: { not: null },
        status: 'DELIVERED',
      },
    });

    const totalAssignedOrders = await this.prisma.order.count({
      where: {
        restaurantId,
        assignedRestaurantDriverId: { not: null },
      },
    });

    const successRate = totalAssignedOrders > 0 ? Math.round((completedOrders / totalAssignedOrders) * 100) : 100;

    return {
      avgDeliveryTimeMins: 22,
      deliverySuccessRate: successRate,
      riderRatings: 4.9,
      ordersDelivered: completedOrders,
      activeRidersCount: staff.filter((s) => s.isActive).length,
    };
  }
}