import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException, ForbiddenException, Optional, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantStatus, UserRole, DeliveryMode, AuditAction } from '@prisma/client';
import { normalizeIndianPhone } from '@foodhub/utils';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { serializePrisma } from '../../common/utils/serializer.util';
import { OrdersGateway } from '../orders/orders.gateway';
import { ORDER_EVENTS } from '../orders/orders.events';

const isUUID = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: OrdersGateway,
  ) {}

  async verifyRestaurantAccess(restaurantId: string, user: any) {
    if (!user) {
      throw new UnauthorizedException('Authentication required to access restaurant management.');
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return true;
    }
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }
    if (restaurant.ownerId === user.id) {
      return true;
    }
    const staff = await this.prisma.restaurantStaff.findFirst({
      where: { restaurantId, userId: user.id },
    });
    if (staff) {
      return true;
    }
    throw new ForbiddenException('Access denied. You do not own or manage this restaurant.');
  }

  async createRestaurant(dto: CreateRestaurantDto) {
    // Validate required fields — never invent defaults
    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException('A password is required to create the restaurant owner account.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('An email address is required for the restaurant owner account.');
    }
    if (!dto.ownerName || !dto.ownerName.trim()) {
      throw new BadRequestException('Owner full name is required.');
    }

    const rawPassword = dto.password.trim();
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const canonicalPhone = normalizeIndianPhone(dto.phone);
    const email = dto.email.trim().toLowerCase();
    const ownerName = dto.ownerName.trim();

    // Execute atomic transaction for User, Profile, Restaurant, and Staff linkage
    const result = await this.prisma.$transaction(async (tx) => {
      let ownerId = dto.ownerId;

      if (ownerId) {
        // Update existing user role to RESTAURANT_OWNER and update passwordHash
        await tx.user.update({
          where: { id: ownerId },
          data: {
            phone: canonicalPhone,
            role: UserRole.RESTAURANT_OWNER,
            ...(dto.password ? { passwordHash } : {}),
            isVerified: true,
            isActive: true,
          },
        });
      } else {
        const rawTenDigits = canonicalPhone.replace(/\D/g, '').slice(-10);
        const uniqueFormats = [
          canonicalPhone,
          `91${rawTenDigits}`,
          rawTenDigits,
        ];

        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              ...uniqueFormats.map((p) => ({ phone: p })),
              { email },
            ],
          },
        });

        if (existingUser) {
          throw new ConflictException(
            'An account with this phone number or email already exists. Please log in or use a different phone/email.',
          );
        }

        const nameParts = ownerName.split(' ');
        const newUser = await tx.user.create({
          data: {
            phone: canonicalPhone,
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

      if (!fullAddress && !dto.address) {
        throw new BadRequestException('Restaurant street address is required.');
      }

      // FSSAI is required for restaurant registration
      if (!dto.fssaiLicense || !dto.fssaiLicense.trim()) {
        throw new BadRequestException('FSSAI license number is required for restaurant registration.');
      }

      const restaurant = await tx.restaurant.create({
        data: {
          ownerId,
          name: dto.name,
          slug,
          phone: canonicalPhone,
          licenseFssai: dto.fssaiLicense.trim(),
          gstin: dto.gstin?.trim() || null,
          addressLine: fullAddress || dto.address,
          latitude: dto.latitude != null ? Number(dto.latitude) : null,
          longitude: dto.longitude != null ? Number(dto.longitude) : null,
          bannerUrl: dto.bannerUrl || dto.logoUrl,
          menuUrl: dto.menuUrl,
          fssaiUrl: dto.fssaiUrl,
          panUrl: dto.panUrl,
          panNumber: dto.panNumber,


          status: RestaurantStatus.PENDING_APPROVAL,
          isOpen: false,
        },
      });

      // Create RestaurantDocument records — only from real uploaded URLs, never fake fallbacks
      if (dto.fssaiUrl) {
        await tx.restaurantDocument.create({
          data: {
            restaurantId: restaurant.id,
            documentType: 'FSSAI',
            documentUrl: dto.fssaiUrl,
          },
        });
      }

      if (dto.panUrl) {
        await tx.restaurantDocument.create({
          data: {
            restaurantId: restaurant.id,
            documentType: 'PAN',
            documentUrl: dto.panUrl,
          },
        });
      }

      if (dto.menuUrl) {
        await tx.restaurantDocument.create({
          data: {
            restaurantId: restaurant.id,
            documentType: 'MENU',
            documentUrl: dto.menuUrl,
          },
        });
      }

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
        phone: canonicalPhone,
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

  async findPendingApprovalRestaurants(statusFilter?: string) {
    let whereCondition: any = { deletedAt: null };
    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      const s = statusFilter.toUpperCase();
      if (s === 'PENDING' || s === 'PENDING_APPROVAL') whereCondition.status = RestaurantStatus.PENDING_APPROVAL;
      else if (s === 'APPROVED') whereCondition.status = RestaurantStatus.APPROVED;
      else if (s === 'SUSPENDED') whereCondition.status = RestaurantStatus.SUSPENDED;
      else if (s === 'REJECTED') whereCondition.status = RestaurantStatus.REJECTED;
      else whereCondition.status = s as any;
    } else if (!statusFilter) {
      whereCondition.status = RestaurantStatus.PENDING_APPROVAL;
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where: whereCondition,
      include: {
        categories: {
          include: {
            foodItems: true,
          },
        },
        documents: true,
        galleries: true,
        staff: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

  async findAllRestaurants(adminView = false, userLat?: number, userLng?: number) {
    const whereCondition: any = adminView
      ? { deletedAt: null }
      : { status: RestaurantStatus.APPROVED, isOpen: true, deletedAt: null };

    const restaurants = await this.prisma.restaurant.findMany({
      where: whereCondition,
      include: {
        categories: {
          include: {
            foodItems: {
              where: { deletedAt: null },
            },
          },
        },
        documents: true,
        galleries: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return serializePrisma(restaurants.map((restaurant) => {
      let distanceKm: number | null = null;
      if (userLat !== undefined && userLng !== undefined && restaurant.latitude && restaurant.longitude) {
        }

      return {
        ...restaurant,
        distanceKm,
        avgRating: restaurant.avgRating
          ? Number(restaurant.avgRating)
          : 0,
        commissionRate: restaurant.commissionRate
          ? Number(restaurant.commissionRate)
          : 0,
      };
    }));
  }

  async findRestaurantById(idOrSlug: string) {
    const whereCondition = isUUID(idOrSlug)
      ? { id: idOrSlug }
      : { slug: idOrSlug };

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ...whereCondition, deletedAt: null },
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
        documents: true,
        galleries: true,
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

  private async deleteFileIfLocal(fileUrl?: string | null) {
    if (!fileUrl) return;
    try {
      if (fileUrl.includes('/uploads/')) {
        const relativePath = fileUrl.substring(fileUrl.indexOf('/uploads/'));
        const absolutePath = path.join(process.cwd(), 'public', relativePath);
        if (fs.existsSync(absolutePath)) {
          await fs.promises.unlink(absolutePath);
        }
      }
    } catch {
      /* ignore file system errors */
    }
  }

  async updateVerificationStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING' | string,
    rejectionReason?: string,
    adminUserId?: string,
  ) {
    const prevRestaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, ownerId: true },
    });

    if (!prevRestaurant) {
      throw new NotFoundException(`Restaurant ${id} not found.`);
    }

    const previousStatus = prevRestaurant.status;

    let prismaStatus: RestaurantStatus;
    if (status === 'APPROVED') {
      prismaStatus = RestaurantStatus.APPROVED;
    } else if (status === 'REJECTED') {
      prismaStatus = RestaurantStatus.REJECTED;
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new BadRequestException('A valid rejection reason is mandatory when rejecting a restaurant.');
      }
    } else if (status === 'SUSPENDED') {
      prismaStatus = RestaurantStatus.SUSPENDED;
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new BadRequestException('A valid reason is mandatory when suspending a restaurant.');
      }
    } else {
      prismaStatus = RestaurantStatus.PENDING_APPROVAL;
    }

    const isOpen = prismaStatus === RestaurantStatus.APPROVED;

    // Update restaurant operational state (preserving all historical orders & financial records)
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        status: prismaStatus,
        isOpen,
        rejectionReason: (prismaStatus === RestaurantStatus.REJECTED || prismaStatus === RestaurantStatus.SUSPENDED)
          ? rejectionReason?.trim() || null
          : null,
      },
    });

    // Update merchant user status ONLY if the user is strictly a dedicated RESTAURANT_OWNER.
    // NEVER modify isActive for ADMIN, SUPER_ADMIN, CUSTOMER, or DELIVERY_PARTNER accounts.
    if (restaurant.ownerId) {
      const ownerUser = await this.prisma.user.findUnique({
        where: { id: restaurant.ownerId },
        select: { id: true, role: true, isActive: true },
      });

      if (ownerUser && ownerUser.role === UserRole.RESTAURANT_OWNER) {
        if (prismaStatus === RestaurantStatus.APPROVED) {
          await this.prisma.user.update({
            where: { id: ownerUser.id },
            data: {
              isVerified: true,
              isActive: true,
            },
          });
        } else if (prismaStatus === RestaurantStatus.REJECTED || prismaStatus === RestaurantStatus.SUSPENDED) {
          // Check if merchant owns any other approved active restaurant before deactivating account
          const otherApprovedRestaurant = await this.prisma.restaurant.findFirst({
            where: {
              ownerId: ownerUser.id,
              id: { not: id },
              status: RestaurantStatus.APPROVED,
              deletedAt: null,
            },
          });

          if (!otherApprovedRestaurant) {
            await this.prisma.user.update({
              where: { id: ownerUser.id },
              data: {
                isActive: false,
              },
            });
          }
        }
      }
    }

    // Ensure staff record exists if approved
    if (prismaStatus === RestaurantStatus.APPROVED) {
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
    }

    // Create Audit Log Entry
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: AuditAction.STATUS_CHANGE,
          entityName: 'Restaurant',
          entityId: id,
          oldValue: { status: previousStatus },
          newValue: { status: prismaStatus, reason: rejectionReason?.trim() || null },
        },
      });
    } catch {
      /* audit log fallback */
    }

    // Emit Realtime Socket.IO Events
    if (this.gateway) {
      this.gateway.emitToRestaurant(id, ORDER_EVENTS.RESTAURANT_STATUS_CHANGED as any, {
        restaurantId: id,
        status: prismaStatus,
        isOpen,
        reason: rejectionReason?.trim() || null,
      });
      this.gateway.emitToAdmin(ORDER_EVENTS.RESTAURANT_STATUS_CHANGED as any, {
        restaurantId: id,
        status: prismaStatus,
        isOpen,
        reason: rejectionReason?.trim() || null,
      });
    }

    return serializePrisma({
      ...restaurant,
      avgRating: restaurant.avgRating ? Number(restaurant.avgRating) : 0,
      commissionRate: restaurant.commissionRate ? Number(restaurant.commissionRate) : 0,
    });
  }

  async updateDeliveryMode(id: string, deliveryMode: DeliveryMode) {
    await this.findRestaurantById(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { deliveryMode },
    });
  }

  async updateDeliveryRadius(id: string, deliveryRadius: number) {
    await this.findRestaurantById(id);
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { deliveryRadius: Number(deliveryRadius) },
    });
    return serializePrisma(updated);
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
    // All vehicle/contact data must come from the submitted DTO — no defaults
    if (!dto.vehicleType) {
      throw new BadRequestException('Vehicle type is required.');
    }
    if (!dto.vehicleNumber) {
      throw new BadRequestException('Vehicle registration number is required.');
    }
    if (!dto.firstName) {
      throw new BadRequestException('First name is required.');
    }
    if (!dto.phone) {
      throw new BadRequestException('Phone number is required.');
    }
    return this.prisma.restaurantDeliveryStaff.create({
      data: {
        restaurantId,
        firstName: dto.firstName,
        lastName: dto.lastName || '',
        phone: dto.phone,
        email: dto.email || null,
        avatar: dto.avatar || null,
        vehicleType: dto.vehicleType,
        vehicleNumber: dto.vehicleNumber,
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

  async updateCommissionRate(restaurantId: string, commissionRate: number | null, adminUserId?: string) {
    if (commissionRate !== null && commissionRate !== undefined) {
      const num = Number(commissionRate);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new BadRequestException('Commission rate must be a valid number between 0% and 100% or null (unconfigured).');
      }
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const previousRate = restaurant.commissionRate !== null ? Number(restaurant.commissionRate) : null;
    const newRate = commissionRate !== null && commissionRate !== undefined ? Number(commissionRate) : null;

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        commissionRate: newRate,
      },
    });

    // Record immutable audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId || null,
        action: 'UPDATE',
        entityName: 'RestaurantCommission',
        entityId: restaurantId,
        oldValue: { commissionRate: previousRate } as any,
        newValue: { commissionRate: newRate } as any,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      commissionRate: newRate,
      commissionStatus: newRate !== null ? 'CONFIGURED' : 'UNCONFIGURED',
      previousRate,
    };
  }
}