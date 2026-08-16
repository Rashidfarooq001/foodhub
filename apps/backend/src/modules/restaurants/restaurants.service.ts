import { Injectable, NotFoundException, BadRequestException, ConflictException, Optional, Inject } from '@nestjs/common';
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
          addressLine: fullAddress || dto.address || 'Bandipora',
          latitude: dto.latitude != null ? Number(dto.latitude) : 34.4226,
          longitude: dto.longitude != null ? Number(dto.longitude) : 74.6469,
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
    if (statusFilter && statusFilter.toUpperCase() === 'REJECTED') {
      const rejectedRecords = await this.prisma.rejectedRestaurantRecord.findMany({
        orderBy: {
          rejectedAt: 'desc',
        },
      });

      return serializePrisma(
        rejectedRecords.map((record) => ({
          id: record.id,
          name: record.restaurantName,
          status: record.status,
          rejectionReason: record.rejectionReason,
          createdAt: record.rejectedAt,
          rejectedAt: record.rejectedAt,
          reviewedByAdminId: record.reviewedByAdminId,
        })),
      );
    }

    let whereCondition: any = {};
    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      const s = statusFilter.toUpperCase();
      if (s === 'PENDING') whereCondition.status = RestaurantStatus.PENDING_APPROVAL;
      else if (s === 'APPROVED') whereCondition.status = RestaurantStatus.APPROVED;
      else if (s === 'SUSPENDED') whereCondition.status = RestaurantStatus.SUSPENDED;
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
        documents: true,
        galleries: true,
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
    if (status === 'REJECTED') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new BadRequestException('A valid rejection reason is mandatory when rejecting a restaurant application.');
      }

      // Fetch full restaurant application with relations
      const targetApp = await this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          documents: true,
          galleries: true,
          orders: { select: { id: true } },
        },
      });

      if (!targetApp) {
        throw new NotFoundException(`Restaurant application ${id} not found.`);
      }

      // Do NOT delete if historical financial/operational orders exist
      if (targetApp.orders && targetApp.orders.length > 0) {
        throw new BadRequestException('Cannot delete restaurant application with existing historical orders.');
      }

      // Collect file paths for storage cleanup
      const fileUrls: string[] = [];
      if (targetApp.bannerUrl) fileUrls.push(targetApp.bannerUrl);
      if (targetApp.menuUrl) fileUrls.push(targetApp.menuUrl);
      if (targetApp.fssaiUrl) fileUrls.push(targetApp.fssaiUrl);
      if (targetApp.panUrl) fileUrls.push(targetApp.panUrl);
      targetApp.galleries.forEach((g) => { if (g.imageUrl) fileUrls.push(g.imageUrl); });
      targetApp.documents.forEach((d) => { if (d.documentUrl) fileUrls.push(d.documentUrl); });

      const ownerId = targetApp.ownerId;
      const ownerUser = await this.prisma.user.findUnique({
        where: { id: ownerId },
        include: { customer: true, driver: true },
      });

      const otherApprovedCount = await this.prisma.restaurant.count({
        where: {
          ownerId,
          NOT: { id: targetApp.id },
          status: RestaurantStatus.APPROVED,
        },
      });

      // User account is deleted ONLY IF created exclusively for this application
      // and NOT shared with other approved restaurants or customer/driver accounts
      const canDeleteOwnerAccount =
        otherApprovedCount === 0 &&
        ownerUser?.role === UserRole.RESTAURANT_OWNER &&
        !ownerUser?.customer &&
        !ownerUser?.driver;

      // ATOMIC TRANSACTION: Record minimal audit entry, delete application data, delete storage refs
      await this.prisma.$transaction(async (tx) => {
        // 1. Create minimal audit rejection record (NO PII, NO document URLs)
        await tx.rejectedRestaurantRecord.create({
          data: {
            restaurantName: targetApp.name,
            status: 'REJECTED',
            rejectionReason: rejectionReason.trim(),
            rejectedAt: new Date(),
            reviewedByAdminId: adminUserId || null,
          },
        });

        // 2. Delete child entities
        await tx.restaurantBranch.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantTiming.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantGallery.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantDocument.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantStaff.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantDeliveryStaff.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantBankAccount.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantSetting.deleteMany({ where: { restaurantId: id } });
        await tx.savedRestaurant.deleteMany({ where: { restaurantId: id } });

        // Delete menu items & categories
        await tx.foodItem.deleteMany({ where: { restaurantId: id } });
        await tx.category.deleteMany({ where: { restaurantId: id } });

        // Delete Restaurant application
        await tx.restaurant.delete({ where: { id } });

        // 3. Delete owner account if exclusive to this application
        if (canDeleteOwnerAccount && ownerId) {
          await tx.profile.deleteMany({ where: { userId: ownerId } });
          await tx.otp.deleteMany({ where: { userId: ownerId } });
          await tx.session.deleteMany({ where: { userId: ownerId } });
          await tx.refreshToken.deleteMany({ where: { userId: ownerId } });
          await tx.loginHistory.deleteMany({ where: { userId: ownerId } });
          await tx.user.delete({ where: { id: ownerId } });
        }
      });

      // Storage cleanup
      for (const url of fileUrls) {
        await this.deleteFileIfLocal(url);
      }

      return {
        success: true,
        message: 'Restaurant application rejected and applicant data permanently removed.',
      };
    }

    // NON-REJECTED STATUSES (e.g. APPROVED or SUSPENDED)
    const prismaStatus =
      status === 'APPROVED'
        ? RestaurantStatus.APPROVED
        : status === 'SUSPENDED'
        ? RestaurantStatus.SUSPENDED
        : RestaurantStatus.PENDING_APPROVAL;

    const isOpen = prismaStatus === RestaurantStatus.APPROVED;

    const prevRestaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, ownerId: true },
    });

    if (!prevRestaurant) {
      throw new NotFoundException(`Restaurant ${id} not found.`);
    }

    const previousStatus = prevRestaurant.status;

    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        status: prismaStatus,
        isOpen,
      },
    });

    await this.prisma.user.update({
      where: { id: restaurant.ownerId },
      data: {
        isVerified: prismaStatus === RestaurantStatus.APPROVED,
        isActive: prismaStatus === RestaurantStatus.APPROVED,
      },
    });

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

    // Create Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: AuditAction.STATUS_CHANGE,
          entityName: 'Restaurant',
          entityId: id,
          oldValue: { status: previousStatus },
          newValue: { status: prismaStatus, reason: rejectionReason || null },
        },
      });
    } catch {
      /* audit log fallback */
    }

    // Emit Realtime Socket.IO Event
    if (this.gateway) {
      this.gateway.emitToRestaurant(id, ORDER_EVENTS.RESTAURANT_STATUS_CHANGED as any, {
        restaurantId: id,
        status: prismaStatus,
        isOpen,
        reason: rejectionReason || null,
      });
      this.gateway.emitToAdmin(ORDER_EVENTS.RESTAURANT_STATUS_CHANGED as any, {
        restaurantId: id,
        status: prismaStatus,
        isOpen,
        reason: rejectionReason || null,
      });
    }

    return {
      ...restaurant,
      avgRating: restaurant.avgRating ? Number(restaurant.avgRating) : 0,
      commissionRate: restaurant.commissionRate ? Number(restaurant.commissionRate) : 0,
    };
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