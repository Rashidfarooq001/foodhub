import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UserRole, DriverStatus } from '@prisma/client';
import { normalizeIndianPhone } from '@foodhub/utils';
import * as bcrypt from 'bcrypt';

/**
 * DriversService — manages FoodHub courier partner accounts.
 *
 * DATABASE IS THE SOURCE OF TRUTH.
 * This service NEVER:
 * - Hardcodes default passwords
 * - Invents fake driving license numbers
 * - Creates a default vehicle type (missing vehicleType → 400 error)
 * - Inserts fake document URLs
 * - Leaves partial records on failure (all writes are inside $transaction)
 */
@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin direct creation of a delivery partner account.
   * All data must come from the submitted DTO — no defaults invented here.
   */
  async createDriver(dto: CreateDriverDto, isApprovedByAdmin = true) {
    // 1. Validate required fields that cannot be defaulted
    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException('Password is required to create a delivery partner account.');
    }
    if (!dto.licenseNumber || !dto.licenseNumber.trim()) {
      throw new BadRequestException('Driving license number is required.');
    }

    // 2. If vehicleNumber is provided, vehicleType must also be provided
    if (dto.vehicleNumber && !dto.vehicleType) {
      throw new BadRequestException('Vehicle type is required when a vehicle registration number is provided.');
    }

    // 3. Normalize phone to canonical +91XXXXXXXXXX format
    const canonicalPhone = normalizeIndianPhone(dto.phone);

    // 4. Pre-check for duplicate phone / email before starting transaction
    const phoneConflict = await this.prisma.user.findFirst({
      where: { phone: canonicalPhone },
    });
    if (phoneConflict) {
      throw new ConflictException('An account with this phone number is already registered.');
    }

    if (dto.email) {
      const emailConflict = await this.prisma.user.findFirst({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (emailConflict) {
        throw new ConflictException('An account with this email address is already registered.');
      }
    }

    // 5. Pre-check for duplicate license number
    const licenseConflict = await this.prisma.driver.findFirst({
      where: { licenseNumber: dto.licenseNumber.trim().toUpperCase() },
    });
    if (licenseConflict) {
      throw new ConflictException('This driving license number is already registered with another account.');
    }

    // 6. Pre-check for duplicate vehicle registration number
    if (dto.vehicleNumber) {
      const vehicleConflict = await this.prisma.driverVehicle.findFirst({
        where: { vehicleNumber: dto.vehicleNumber.trim().toUpperCase() },
      });
      if (vehicleConflict) {
        throw new ConflictException('This vehicle registration number is already registered with another account.');
      }
    }

    // 7. Hash password using the value submitted by the admin — no defaults
    const passwordHash = await bcrypt.hash(dto.password.trim(), 12);

    // 8. Parse name into first/last components
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    if (!firstName) {
      throw new BadRequestException('A valid full name is required.');
    }

    const canonicalEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
    const canonicalLicense = dto.licenseNumber.trim().toUpperCase();
    const canonicalVehicleNumber = dto.vehicleNumber?.trim().toUpperCase();

    // 9. Atomic transaction: User + Driver + DriverVehicle + DriverDocument
    //    If ANY step fails the entire transaction rolls back.
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: canonicalPhone,
          email: canonicalEmail,
          passwordHash,
          role: UserRole.DELIVERY_PARTNER,
          isVerified: true,
          isActive: true,
          profile: {
            create: {
              firstName,
              lastName,
            },
          },
        },
        include: { profile: true },
      });

      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          licenseNumber: canonicalLicense,
          isApproved: isApprovedByAdmin,
          status: isApprovedByAdmin ? DriverStatus.OFFLINE : DriverStatus.SUSPENDED,
        },
      });

      let vehicle = null;
      if (dto.vehicleType && canonicalVehicleNumber) {
        vehicle = await tx.driverVehicle.create({
          data: {
            driverId: driver.id,
            vehicleType: dto.vehicleType,
            vehicleNumber: canonicalVehicleNumber,
          },
        });
      }

      // Save uploaded document references — only real URLs, never fake ones
      if (dto.licenseUrl) {
        await tx.driverDocument.create({
          data: {
            driverId: driver.id,
            documentType: 'DL',
            documentUrl: dto.licenseUrl,
          },
        });
      }
      if (dto.rcUrl) {
        await tx.driverDocument.create({
          data: {
            driverId: driver.id,
            documentType: 'RC',
            documentUrl: dto.rcUrl,
          },
        });
      }
      if (dto.idProofUrl) {
        await tx.driverDocument.create({
          data: {
            driverId: driver.id,
            documentType: 'AADHAAR',
            documentUrl: dto.idProofUrl,
          },
        });
      }

      return { user, driver, vehicle };
    });

    return {
      id: result.driver.id,
      userId: result.user.id,
      licenseNumber: result.driver.licenseNumber,
      isApproved: result.driver.isApproved,
      status: result.driver.status,
      vehicle: result.vehicle,
      user: {
        id: result.user.id,
        phone: result.user.phone,
        email: result.user.email,
        role: result.user.role,
        profile: result.user.profile,
      },
    };
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
        documents: true,
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
        documents: true,
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
