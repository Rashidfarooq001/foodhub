import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

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

    const cleanDigits = cleanInput.replace(/\D/g, '');
    const phoneFormats: string[] = [cleanInput];

    if (cleanDigits.length >= 10) {
      const tenDigits = cleanDigits.slice(-10);
      phoneFormats.push(
        tenDigits,
        `+91${tenDigits}`,
        `91${tenDigits}`,
      );
    }

    const uniqueFormats = Array.from(new Set(phoneFormats));

    return this.prisma.user.findFirst({
      where: {
        OR: uniqueFormats.map((p) => ({ phone: p })),
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

  async createUser(phone: string, passwordHash: string, role: UserRole = UserRole.CUSTOMER) {
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
        phone,
        passwordHash,
        role,
        isVerified: true,
        profile: {
          create: {
            firstName: 'Customer',
            lastName: phone.slice(-4),
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
        city: dto.city || 'Bengaluru',
        state: dto.state || 'Karnataka',
        postalCode: dto.postalCode || '560038',
        latitude: dto.latitude || 12.9780,
        longitude: dto.longitude || 77.6400,
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
