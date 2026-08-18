import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UserRole, DriverStatus, AuditAction } from '@prisma/client';
import { normalizeIndianPhone } from '@foodhub/utils';
import * as bcrypt from 'bcrypt';
import { OrdersGateway } from '../orders/orders.gateway';
import { ORDER_EVENTS } from '../orders/orders.events';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: OrdersGateway,
  ) {}

  /**
   * Driver creation: creates User + Driver + DriverVehicle + DriverDocument in an atomic transaction.
   * Accepts password directly from Admin form with bcrypt 12-round hashing.
   */
  async createDriver(dto: CreateDriverDto, isApprovedByAdmin = true) {
    // 1. Validate required fields
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Delivery partner full name is required.');
    }
    if (!dto.phone || !dto.phone.trim()) {
      throw new BadRequestException('Mobile number is required.');
    }
    if (!dto.licenseNumber || !dto.licenseNumber.trim()) {
      throw new BadRequestException('Driving license number is required.');
    }
    if (!dto.password || dto.password.trim().length < 8) {
      throw new BadRequestException('A temporary password of at least 8 characters is required.');
    }

    // 2. Validate Indian phone format: exactly 10 digits starting with 6-9
    const rawDigits = dto.phone.replace(/\D/g, '');
    const cleanDigits = rawDigits.startsWith('91') && rawDigits.length === 12
      ? rawDigits.substring(2)
      : rawDigits;

    if (cleanDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanDigits)) {
      throw new BadRequestException(
        'Invalid Indian phone number. Must be 10 digits starting with 6, 7, 8, or 9.',
      );
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
          isActive: true,
          isVerified: true,
          profile: {
            create: {
              firstName,
              lastName: lastName || undefined,
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
            isVerified: isApprovedByAdmin,
          },
        });
      }
      if (dto.rcUrl) {
        await tx.driverDocument.create({
          data: {
            driverId: driver.id,
            documentType: 'RC',
            documentUrl: dto.rcUrl,
            isVerified: isApprovedByAdmin,
          },
        });
      }
      if (dto.idProofUrl) {
        await tx.driverDocument.create({
          data: {
            driverId: driver.id,
            documentType: 'AADHAAR',
            documentUrl: dto.idProofUrl,
            isVerified: isApprovedByAdmin,
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

  async getVehicleTypes() {
    return [
      { code: 'MOTORCYCLE', name: 'Motorcycle / Bike' },
      { code: 'SCOOTER', name: 'Scooter' },
      { code: 'EV_SCOOTER', name: 'Electric Scooter (EV)' },
      { code: 'BICYCLE', name: 'Bicycle' },
    ];
  }

  async findAllDrivers() {
    return this.prisma.driver.findMany({
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
        documents: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findPendingApplications() {
    return this.prisma.driver.findMany({
      where: {
        isApproved: false,
        user: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
        documents: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async updateApprovalStatus(driverId: string, isApproved: boolean, reason?: string, adminUserId?: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const previousStatus = driver.status;
    const nextStatus = isApproved ? DriverStatus.OFFLINE : DriverStatus.SUSPENDED;

    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        isApproved,
        status: nextStatus,
      },
      include: { user: { include: { profile: true } } },
    });

    // Update user status: if rejected, deactivate the user account so it is removed from the pending queue
    if (driver.userId && driver.user?.role === UserRole.DELIVERY_PARTNER) {
      await this.prisma.user.update({
        where: { id: driver.userId },
        data: {
          isVerified: isApproved,
          isActive: isApproved,
        },
      });
    }

    // Create Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: AuditAction.STATUS_CHANGE,
          entityName: 'Driver',
          entityId: driverId,
          oldValue: { isApproved: driver.isApproved, status: previousStatus },
          newValue: { isApproved, status: nextStatus, reason: reason || null },
        },
      });
    } catch {
      /* audit log fallback */
    }

    // Realtime Socket broadcast
    if (this.gateway) {
      this.gateway.emitToDriver(driverId, ORDER_EVENTS.DRIVER_STATUS_CHANGED as any, {
        driverId,
        isApproved,
        status: nextStatus,
        reason: reason || null,
      });
      this.gateway.emitToAdmin(ORDER_EVENTS.DRIVER_STATUS_CHANGED as any, {
        driverId,
        isApproved,
        status: nextStatus,
        reason: reason || null,
      });
    }

    return updated;
  }
}
