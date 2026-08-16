import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { normalizeIndianPhone } from '@foodhub/utils';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByPhone(phone: string) {
    if (!phone || !phone.trim()) return null;
    const cleanInput = phone.trim();

    if (cleanInput.includes('@')) {
      return this.prisma.user.findFirst({
        where: { email: cleanInput.toLowerCase() },
        include: { profile: true, restaurantStaff: { include: { restaurant: true } } },
      });
    }

    let canonicalPhone: string;
    try {
      canonicalPhone = normalizeIndianPhone(cleanInput);
    } catch {
      return null;
    }

    const rawTenDigits = canonicalPhone.replace(/\D/g, '').slice(-10);
    const formatsToMatch = [
      canonicalPhone,           // Canonical: +91XXXXXXXXXX
      `91${rawTenDigits}`,      // Legacy 12-digit: 91XXXXXXXXXX
      rawTenDigits,             // Legacy 10-digit: XXXXXXXXXX
    ];

    return this.prisma.user.findFirst({
      where: {
        OR: formatsToMatch.map((p) => ({ phone: p })),
      },
      include: { profile: true, restaurantStaff: { include: { restaurant: true } } },
    });
  }

  async findUserByPhoneOrEmail(input: string) {
    return this.findUserByPhone(input);
  }

  async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async getCustomersForAdmin(search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const userWhere: any = { role: UserRole.CUSTOMER };

    if (search && search.trim()) {
      const q = search.trim();
      userWhere.OR = [
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { firstName: { contains: q, mode: 'insensitive' } } },
        { profile: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          customer: {
            include: {
              addresses: true,
              orders: {
                select: {
                  id: true,
                  status: true,
                  totalAmount: true,
                  paymentStatus: true,
                  createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where: userWhere }),
    ]);

    const customers = users.map((u) => {
      const cust = u.customer;
      const orders = cust?.orders || [];
      const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
      const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
      const totalSpent = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const lastOrder = orders[0];

      return {
        id: cust?.id || u.id,
        userId: u.id,
        name: u.profile ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim() : 'Customer',
        phone: u.phone,
        email: u.email || '—',
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        addressCount: cust?.addresses?.length || 0,
      };
    });

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllUsersForAdmin(roleFilter?: string, search?: string, page = 1, limit = 50) {
    const where: any = {};
    if (roleFilter && roleFilter.toUpperCase() !== 'ALL') {
      where.role = roleFilter.toUpperCase() as any;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { firstName: { contains: q, mode: 'insensitive' } } },
        { profile: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          customer: true,
          driver: { include: { vehicles: true } },
          restaurantStaff: { include: { restaurant: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        phone: u.phone,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        profile: u.profile,
        driver: u.driver,
        restaurant: u.restaurantStaff?.[0]?.restaurant || null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatusByAdmin(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: { profile: true },
    });

    return {
      id: updated.id,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  async createUser(phone: string, passwordHash: string, role: UserRole = UserRole.CUSTOMER) {
    const canonicalPhone = normalizeIndianPhone(phone);

    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
      const existingAdminCount = await this.prisma.user.count({
        where: { OR: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }] },
      });
      if (existingAdminCount >= 1) {
        throw new BadRequestException('A single platform Admin account already exists. Secondary admin creation is prohibited.');
      }
    }

    return this.prisma.user.create({
      data: {
        phone: canonicalPhone,
        passwordHash,
        role,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Customer',
            lastName: canonicalPhone.slice(-4),
          },
        },
      },
      include: { profile: true, restaurantStaff: { include: { restaurant: true } } },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findUserById(userId);

    const profileData: any = {};
    if (dto.firstName !== undefined) profileData.firstName = dto.firstName;
    if (dto.lastName !== undefined) profileData.lastName = dto.lastName;
    if (dto.gender !== undefined) profileData.gender = dto.gender;
    if (dto.avatarUrl !== undefined) profileData.avatarUrl = dto.avatarUrl;

    const updatedProfile = await this.prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        firstName: dto.firstName || 'User',
        lastName: dto.lastName || '',
        gender: dto.gender,
        avatarUrl: dto.avatarUrl || null,
      },
    });

    return {
      ...user,
      profile: updatedProfile,
    };
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  // --- ADDRESS MANAGEMENT ---
  private async getOrCreateCustomerId(userId: string): Promise<string> {
    const existing = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (existing) return existing.id;

    const newCustomer = await this.prisma.customer.create({
      data: { userId },
    });
    return newCustomer.id;
  }

  async getCustomerAddresses(userId: string) {
    const customerId = await this.getOrCreateCustomerId(userId);
    return this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createCustomerAddress(userId: string, dto: any) {
    const customerId = await this.getOrCreateCustomerId(userId);

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    const count = await this.prisma.customerAddress.count({
      where: { customerId },
    });

    return this.prisma.customerAddress.create({
      data: {
        customerId,
        addressLabel: dto.addressLabel || 'Home',
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city || '',
        state: dto.state || '',
        postalCode: dto.postalCode || '',
        latitude: dto.latitude !== undefined && dto.latitude !== null ? dto.latitude : 0,
        longitude: dto.longitude !== undefined && dto.longitude !== null ? dto.longitude : 0,
        isDefault: dto.isDefault ?? (count === 0),
      },
    });
  }

  async updateCustomerAddress(userId: string, addressId: string, dto: any) {
    const customerId = await this.getOrCreateCustomerId(userId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found or unauthorized');
    }

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        ...(dto.addressLabel && { addressLabel: dto.addressLabel }),
        ...(dto.addressLine1 && { addressLine1: dto.addressLine1 }),
        ...(dto.addressLine2 !== undefined && { addressLine2: dto.addressLine2 }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        ...(dto.postalCode && { postalCode: dto.postalCode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async deleteCustomerAddress(userId: string, addressId: string) {
    const customerId = await this.getOrCreateCustomerId(userId);
    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found or unauthorized');
    }

    await this.prisma.customerAddress.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }
}
