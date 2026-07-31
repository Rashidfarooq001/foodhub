import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ phone }, { email: phone }] },
      include: { profile: true, restaurantStaff: { include: { restaurant: true } } },
    });
  }

  async findUserByPhoneOrEmail(input: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ phone: input }, { email: input }] },
      include: { profile: true, restaurantStaff: { include: { restaurant: true } } },
    });
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

    const updatedProfile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.gender && { gender: dto.gender }),
        ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
      },
      create: {
        userId,
        firstName: dto.firstName || 'Customer',
        lastName: dto.lastName || 'User',
        gender: dto.gender,
        avatarUrl: dto.avatarUrl,
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
}
