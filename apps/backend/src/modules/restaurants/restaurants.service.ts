import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRestaurant(dto: CreateRestaurantDto) {
    let ownerId = dto.ownerId;

    // Create or link restaurant owner account if ownerId not provided directly
    if (!ownerId && (dto.email || dto.phone)) {
      const phone = dto.phone || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const existingUser = await this.prisma.user.findFirst({
        where: { OR: [{ phone }, { email: dto.email || '' }] },
      });

      if (existingUser) {
        ownerId = existingUser.id;
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { role: UserRole.RESTAURANT_OWNER },
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

    if (!ownerId) {
      let defaultOwner = await this.prisma.user.findFirst({
        where: { role: UserRole.RESTAURANT_OWNER },
      });
      if (!defaultOwner) {
        defaultOwner = await this.prisma.user.create({
          data: {
            phone: '+919900000000',
            email: 'default-owner@foodhub.com',
            passwordHash: await bcrypt.hash('DefaultOwner123!', 10),
            role: UserRole.RESTAURANT_OWNER,
            isVerified: true,
            profile: { create: { firstName: 'Default', lastName: 'Owner' } },
          },
        });
      }
      ownerId = defaultOwner.id;
    }

    const slug = dto.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000);

    const fullAddress = [dto.address, dto.city, dto.state, dto.pin, dto.country]
      .filter(Boolean)
      .join(', ');

    return this.prisma.restaurant.create({
      data: {
        ownerId,
        name:         dto.name,
        slug,
        phone:        dto.phone,
        email:        dto.email,
        licenseFssai: dto.fssaiLicense || `FSSAI-${Math.floor(Math.random() * 1000000000)}`,
        gstin:        dto.gstin || `29GSTIN${Math.floor(Math.random() * 10000)}`,
        addressLine:  fullAddress || dto.address || 'Bengaluru, India',
        latitude:     dto.latitude || 12.9716,
        longitude:    dto.longitude || 77.5946,
        bannerUrl:    dto.bannerUrl,
        status:       RestaurantStatus.APPROVED,
      },
    });
  }

  async findAllRestaurants() {
    return this.prisma.restaurant.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        categories: {
          include: { foodItems: true },
        },
      },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return restaurant;
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

    return this.prisma.restaurant.update({
      where: { id },
      data:  { status: prismaStatus },
    });
  }
}
