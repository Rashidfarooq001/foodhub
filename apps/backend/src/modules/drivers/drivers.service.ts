import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UserRole, DriverStatus, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin direct creation OR Driver self registration */
  async createDriver(dto: CreateDriverDto, isApprovedByAdmin = true) {
    const phone = dto.phone;
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, { email: dto.email || '' }] },
    });

    if (existing) {
      throw new BadRequestException('A user with this phone or email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password || 'DriverPass123!', 10);
    const nameParts = dto.name.split(' ');

    const user = await this.prisma.user.create({
      data: {
        phone,
        email: dto.email,
        passwordHash,
        role: UserRole.DELIVERY_PARTNER,
        isVerified: true,
        profile: {
          create: {
            firstName: nameParts[0] || 'Driver',
            lastName: nameParts.slice(1).join(' ') || '',
          },
        },
      },
    });

    const driver = await this.prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber: dto.licenseNumber || `DL-${Date.now()}`,
        isApproved: isApprovedByAdmin,
        status: isApprovedByAdmin ? DriverStatus.OFFLINE : DriverStatus.SUSPENDED,
      },
    });

    if (dto.vehicleNumber) {
      await this.prisma.driverVehicle.create({
        data: {
          driverId: driver.id,
          vehicleType: (dto.vehicleType as any) || VehicleType.MOTORCYCLE,
          vehicleNumber: dto.vehicleNumber,
          model: 'Standard Delivery Vehicle',
        },
      });
    }

    return { ...driver, user };
  }

  async findAllDrivers() {
    return this.prisma.driver.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
      },
    });
  }

  async findPendingApplications() {
    return this.prisma.driver.findMany({
      where: { isApproved: false },
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
      },
    });
  }

  async updateApprovalStatus(driverId: string, isApproved: boolean) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        isApproved,
        status: isApproved ? DriverStatus.OFFLINE : DriverStatus.SUSPENDED,
      },
    });
  }
}
