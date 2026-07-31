import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantStatus, UserRole, DeliveryMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRestaurant(dto: CreateRestaurantDto) {
    let ownerId = dto.ownerId;

    // Create or link restaurant owner account
    if (!ownerId && (dto.email || dto.phone)) {
      const phone =
        dto.phone ||
        `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone },
            { email: dto.email || '' },
          ],
        },
      });

      if (existingUser) {
        ownerId = existingUser.id;

        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.RESTAURANT_OWNER,
          },
        });
      } else {
        const password = dto.password || 'RestaurantPass123!';
        const passwordHash = await bcrypt.hash(password, 10);

        const nameParts = (dto.ownerName || 'Restaurant Owner').split(' ');

        const newUser = await this.prisma.user.create({
          data: {
            phone,
            email: dto.email,
            passwordHash,
            role: UserRole.RESTAURANT_OWNER,
            isVerified: true,
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

    // Create default owner if none exists
    if (!ownerId) {
      let defaultOwner = await this.prisma.user.findFirst({
        where: {
          role: UserRole.RESTAURANT_OWNER,
        },
      });

      if (!defaultOwner) {
        defaultOwner = await this.prisma.user.create({
          data: {
            phone: '+919900000000',
            email: 'default-owner@foodhub.com',
            passwordHash: await bcrypt.hash(
              'DefaultOwner123!',
              10,
            ),
            role: UserRole.RESTAURANT_OWNER,
            isVerified: true,
            profile: {
              create: {
                firstName: 'Default',
                lastName: 'Owner',
              },
            },
          },
        });
      }

      ownerId = defaultOwner.id;
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

    const restaurant = await this.prisma.restaurant.create({
      data: {
        ownerId,
        name: dto.name,
        slug,
        phone: dto.phone,
        email: dto.email,
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
      },
    });

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

  async findPendingApprovalRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        status: RestaurantStatus.PENDING_APPROVAL,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
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

  async findAllRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        status: {
          in: [RestaurantStatus.APPROVED, RestaurantStatus.SUSPENDED],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
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

  async findRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
       
        categories: {
          include: {
            foodItems: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with ID ${id} not found`,
      );
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

    // Auto-activate associated merchant owner/staff accounts
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