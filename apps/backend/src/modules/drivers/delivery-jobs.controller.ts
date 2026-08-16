import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';
import { OrderStateMachineService } from '../orders/order-state-machine.service';
import { OrderStatus, DeliveryJobStatus, DriverStatus } from '@prisma/client';

@ApiTags('Delivery Jobs Lifecycle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryJobsController {
  private readonly logger = new Logger(DeliveryJobsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachineService: OrderStateMachineService,
  ) {}

  private async getDriverFromReq(req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return null;

    try {
      return await this.prisma.driver.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          status: true,
          isApproved: true,
          currentLat: true,
          currentLng: true,
          avgRating: true,
          user: { select: { id: true, isActive: true, phone: true, profile: true } },
          vehicles: true,
          deliveryJobs: {
            select: {
              id: true,
              orderId: true,
              status: true,
              order: { select: { id: true, orderNumber: true, status: true } },
            },
          },
        },
      });
    } catch (err: any) {
      this.logger.error(`getDriverFromReq failed for userId ${userId}: ${err?.message}`, err?.stack);
      throw err;
    }
  }

  @Get('me/status')
  @ApiOperation({ summary: 'Get current authenticated driver availability and presence status' })
  async getMyStatus(@Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
      }

      const activeJob = (driver.deliveryJobs || []).find((j) =>
        [
          DeliveryJobStatus.ASSIGNED as string,
          DeliveryJobStatus.ARRIVED as string,
          DeliveryJobStatus.PICKED_UP as string,
        ].includes(j.status as string),
      );

      let operationalStatus = 'ONLINE_AVAILABLE';
      let unavailabilityReason: string | null = null;

      if (!driver.user?.isActive) {
        operationalStatus = 'SUSPENDED';
        unavailabilityReason = 'User account suspended';
      } else if (!driver.isApproved) {
        operationalStatus = 'PENDING_APPROVAL';
        unavailabilityReason = 'Pending admin approval';
      } else if (driver.status === DriverStatus.OFFLINE) {
        operationalStatus = 'OFFLINE';
        unavailabilityReason = 'Rider is currently offline';
      } else if (activeJob) {
        operationalStatus = 'BUSY';
        unavailabilityReason = 'Rider is currently executing another delivery';
      }

      return {
        driverId: driver.id,
        userId: driver.userId,
        operationalStatus,
        dutyStatus: driver.status === DriverStatus.ONLINE ? 'ONLINE' : 'OFFLINE',
        isAvailable: operationalStatus === 'ONLINE_AVAILABLE',
        unavailabilityReason,
        isApproved: driver.isApproved,
        activeDelivery: activeJob
          ? {
              jobId: activeJob.id,
              orderId: activeJob.orderId,
              orderNumber: activeJob.order.orderNumber,
              status: activeJob.status,
            }
          : null,
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
      this.logger.error(`getMyStatus failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to fetch driver status',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('me/go-online')
  @ApiOperation({ summary: 'Delivery partner enables availability (Goes ONLINE)' })
  async goOnline(@Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
      }

      if (!driver.user?.isActive) {
        throw new BadRequestException('Cannot go online. Account is suspended or inactive.');
      }

      if (!driver.isApproved) {
        throw new BadRequestException('Cannot go online. Account is pending admin approval.');
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE drivers SET status = 'ONLINE'::"DriverStatus" WHERE id = $1::uuid`,
        driver.id,
      );

      return {
        message: "You are now online and available for deliveries",
        dutyStatus: 'ONLINE',
        operationalStatus: 'ONLINE_AVAILABLE',
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
      this.logger.error(`goOnline failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to go online',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('me/go-offline')
  @ApiOperation({ summary: 'Delivery partner disables availability (Goes OFFLINE)' })
  async goOffline(@Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
      }

      const activeJob = (driver.deliveryJobs || []).find((j) =>
        [
          DeliveryJobStatus.ASSIGNED as string,
          DeliveryJobStatus.ARRIVED as string,
          DeliveryJobStatus.PICKED_UP as string,
        ].includes(j.status as string),
      );

      if (activeJob) {
        throw new BadRequestException('You have an active delivery. Complete the delivery before going offline.');
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE drivers SET status = 'OFFLINE'::"DriverStatus" WHERE id = $1::uuid`,
        driver.id,
      );

      return {
        message: "You are now offline",
        dutyStatus: 'OFFLINE',
        operationalStatus: 'OFFLINE',
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
      this.logger.error(`goOffline failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to go offline',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('me/heartbeat')
  @ApiOperation({ summary: 'Delivery partner presence heartbeat & live GPS ping' })
  async heartbeat(
    @Body('lat') lat?: number,
    @Body('lng') lng?: number,
    @Request() req?: any,
  ) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
      }

      if (lat && lng) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE drivers SET current_lat = $1, current_lng = $2 WHERE id = $3::uuid`,
          lat,
          lng,
          driver.id,
        );
      }

      return {
        status: 'OK',
        timestamp: new Date(),
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
      this.logger.error(`heartbeat failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Heartbeat failed',
        details: err?.stack || String(err),
      });
    }
  }

  @Patch('me/status')
  @ApiOperation({ summary: 'Update rider presence status (ONLINE or OFFLINE)' })
  async updateMyStatus(@Body('status') status: string, @Request() req: any) {
    if (status === 'ONLINE') return this.goOnline(req);
    if (status === 'OFFLINE') return this.goOffline(req);
    throw new BadRequestException('Invalid status value. Use "ONLINE" or "OFFLINE".');
  }

  @Get('jobs/available')
  @ApiOperation({ summary: 'Get available delivery jobs for orders ready for pickup' })
  async getAvailableJobs(@Request() req: any) {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'DELIVERY_PARTNER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only delivery partners can view available delivery jobs.');
    }

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: DeliveryJobStatus.AVAILABLE,
        driverId: null,
        order: {
          status: OrderStatus.READY_FOR_PICKUP,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            deliveryFee: true,
            deliveryAddress: true,
            orderItems: {
              include: { foodItem: true },
            },
            customer: {
              include: { user: { include: { profile: true } } },
            },
            restaurant: {
              select: {
                id: true,
                name: true,
                addressLine: true,
                latitude: true,
                longitude: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => {
      const dropAddr: any = job.dropAddressJson || job.order?.deliveryAddress || {};
      const dropAddressText =
        typeof dropAddr === 'string'
          ? dropAddr
          : dropAddr.street ||
            dropAddr.formattedAddress ||
            [dropAddr.addressLine1, dropAddr.city].filter(Boolean).join(', ') ||
            'Customer Location';

      const customerName =
        job.order?.customer?.user?.profile
          ? `${job.order.customer.user.profile.firstName} ${job.order.customer.user.profile.lastName || ''}`.trim()
          : dropAddr.contactName || 'Customer';

      return {
        id: job.id,
        orderId: job.orderId,
        orderNumber: job.order.orderNumber,
        restaurantName: job.order.restaurant.name,
        restaurantAddress: job.order.restaurant.addressLine,
        customerName,
        customerAddress: dropAddressText,
        distanceKm: job.distanceKm,
        riderPayout: Number(job.riderPayout || Math.max(30, Math.round(Number(job.deliveryFee || 40) * 0.8))),
        estimatedEarnings: Number(job.riderPayout || Math.max(30, Math.round(Number(job.deliveryFee || 40) * 0.8))),
        estimatedTimeMins: Math.max(15, Math.ceil((job.distanceKm / 25) * 60) + 10),
        status: job.status,
        offeredAt: job.offeredAt,
      };
    });
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active delivery job for authenticated driver' })
  async getCurrentJob(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) {
      throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
    }

    const job = await this.prisma.deliveryJob.findFirst({
      where: {
        driverId: driver.id,
        status: {
          in: [
            DeliveryJobStatus.ASSIGNED,
            DeliveryJobStatus.ARRIVED,
            DeliveryJobStatus.PICKED_UP,
            DeliveryJobStatus.DELIVERED,
          ],
        },
        order: {
          status: {
            notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
          },
        },
      },
      include: {
        order: {
          include: {
            restaurant: true,
            orderItems: { include: { foodItem: true } },
            customer: { include: { user: { include: { profile: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!job) return null;

    const pickupAddr: any = job.pickupAddressJson || {};
    const dropAddr: any = job.dropAddressJson || job.order.deliveryAddress || {};

    const dropAddressText =
      typeof dropAddr === 'string'
        ? dropAddr
        : dropAddr.street ||
          dropAddr.formattedAddress ||
          [dropAddr.addressLine1, dropAddr.city].filter(Boolean).join(', ') ||
          'Customer Location';

    const customerName =
      job.order.customer?.user?.profile
        ? `${job.order.customer.user.profile.firstName} ${job.order.customer.user.profile.lastName || ''}`.trim()
        : dropAddr.contactName || 'Customer';

    const customerPhone = job.order.customer?.user?.phone || dropAddr.phone || '+919876543210';

    return {
      id: job.id,
      orderId: job.orderId,
      orderNumber: job.order.orderNumber,
      status: job.order.status,
      jobStatus: job.status,
      paymentMethod: job.order.paymentMethod,
      codAmountToCollect: job.order.paymentMethod === 'COD' ? Number(job.order.totalAmount) : 0,
      estimatedEarnings: Number(job.riderPayout || 40),
      riderPayout: Number(job.riderPayout || 40),
      restaurantName: job.order.restaurant.name,
      restaurantAddress: job.order.restaurant.addressLine,
      restaurantPhone: job.order.restaurant.phone,
      restaurantLat: Number(job.order.restaurant.latitude || 34.3868),
      restaurantLng: Number(job.order.restaurant.longitude || 74.5221),
      customerName,
      customerAddress: dropAddressText,
      customerPhone,
      customerLat: Number(dropAddr.latitude || job.order.restaurant.latitude || 34.3868),
      customerLng: Number(dropAddr.longitude || job.order.restaurant.longitude || 74.5221),
      distanceKm: job.distanceKm,
      items: (job.order.orderItems || []).map((item) => ({
        name: item.foodItem?.name || 'Item',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get earnings & delivery statistics for driver' })
  async getDriverStats(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) {
      return {
        todayEarnings: 0,
        todayDeliveries: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        acceptanceRate: 100,
        completionRate: 100,
        avgRating: 4.9,
        totalRatings: 18,
        walletBalance: 0,
        dutyStatus: 'ONLINE',
      };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedJobs = await this.prisma.deliveryJob.findMany({
      where: {
        driverId: driver.id,
        status: DeliveryJobStatus.DELIVERED,
      },
    });

    const todayJobs = completedJobs.filter((j) => j.deliveredAt && j.deliveredAt >= todayStart);
    const todayEarnings = todayJobs.reduce((sum, j) => sum + Number(j.riderPayout || 0), 0);
    const totalEarnings = completedJobs.reduce((sum, j) => sum + Number(j.riderPayout || 0), 0);

    return {
      todayEarnings,
      todayDeliveries: todayJobs.length,
      weeklyEarnings: totalEarnings,
      monthlyEarnings: totalEarnings,
      acceptanceRate: 100,
      completionRate: 100,
      avgRating: Number(driver.avgRating) > 0 ? Number(driver.avgRating) : 5.0,
      totalRatings: completedJobs.length,
      walletBalance: totalEarnings,
      dutyStatus: driver.status === DriverStatus.OFFLINE ? 'OFFLINE' : 'ONLINE',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed delivery history for driver' })
  async getDriverHistory(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) return [];

    const jobs = await this.prisma.driver.findUnique({
      where: { id: driver.id },
      select: {
        deliveryJobs: {
          where: { status: DeliveryJobStatus.DELIVERED },
          select: {
            id: true,
            distanceKm: true,
            riderPayout: true,
            deliveredAt: true,
            order: {
              select: {
                orderNumber: true,
                restaurant: { select: { name: true } },
              },
            },
          },
          orderBy: { deliveredAt: 'desc' },
          take: 50,
        },
      },
    });

    return (jobs?.deliveryJobs || []).map((j) => ({
      id: j.id,
      orderNumber: j.order.orderNumber,
      restaurantName: j.order.restaurant.name,
      distanceKm: j.distanceKm,
      riderPayout: Number(j.riderPayout),
      deliveredAt: j.deliveredAt,
      status: 'DELIVERED',
    }));
  }

  @Patch('duty-status')
  @ApiOperation({ summary: 'Toggle driver online/offline duty status' })
  async toggleDutyStatus(@Body('status') status: string, @Request() req: any) {
    if (status === 'ONLINE') return this.goOnline(req);
    if (status === 'OFFLINE') return this.goOffline(req);
    throw new BadRequestException('Invalid status value. Use "ONLINE" or "OFFLINE".');
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Rider accepts delivery job (Atomic conditional transaction)' })
  async acceptJob(@Param('id') id: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
      }

      const activeJob = await this.prisma.deliveryJob.findFirst({
        where: {
          driverId: driver.id,
          status: {
            in: [
              DeliveryJobStatus.ASSIGNED,
              DeliveryJobStatus.ARRIVED,
              DeliveryJobStatus.PICKED_UP,
            ],
          },
        },
      });

      if (activeJob) {
        throw new ConflictException('You already have an active delivery in progress. Complete your current delivery before accepting another job.');
      }

      const job = await this.prisma.deliveryJob.findFirst({
        where: {
          OR: [{ id }, { orderId: id }],
        },
      });

      if (!job) {
        throw new NotFoundException('Delivery job not found.');
      }

      if (job.status !== DeliveryJobStatus.AVAILABLE || job.driverId) {
        throw new ConflictException('This delivery job has already been claimed by another delivery partner.');
      }

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver.id,
      };

      return await this.stateMachineService.transition(job.orderId, OrderStatus.DRIVER_ASSIGNED, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`acceptJob failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to accept delivery job',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/arrived')
  @ApiOperation({ summary: 'Rider arrives at pickup restaurant' })
  async arrivedAtRestaurant(@Param('id') id: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      const job = await this.prisma.deliveryJob.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
      });
      if (!job) throw new NotFoundException('Delivery job not found.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver?.id,
      };

      return await this.stateMachineService.transition(job.orderId, OrderStatus.ARRIVED_AT_RESTAURANT, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`arrivedAtRestaurant failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to update job status to arrived',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/picked-up')
  @ApiOperation({ summary: 'Rider picks up order from restaurant' })
  async pickedUpOrder(@Param('id') id: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      const job = await this.prisma.deliveryJob.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
      });
      if (!job) throw new NotFoundException('Delivery job not found.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver?.id,
      };

      return await this.stateMachineService.transition(job.orderId, OrderStatus.PICKED_UP, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`pickedUpOrder failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to update job status to picked up',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/start-delivery')
  @ApiOperation({ summary: 'Rider starts delivery to customer location' })
  async startDelivery(@Param('id') id: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      const job = await this.prisma.deliveryJob.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
      });
      if (!job) throw new NotFoundException('Delivery job not found.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver?.id,
      };

      return await this.stateMachineService.transition(job.orderId, OrderStatus.OUT_FOR_DELIVERY, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`startDelivery failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to update job status to out for delivery',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/delivered')
  @ApiOperation({ summary: 'Rider marks order as delivered to customer' })
  async markDelivered(@Param('id') id: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      const job = await this.prisma.deliveryJob.findFirst({
        where: { OR: [{ id }, { orderId: id }] },
      });
      if (!job) throw new NotFoundException('Delivery job not found.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver?.id,
      };

      return await this.stateMachineService.transition(job.orderId, OrderStatus.DELIVERED, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`markDelivered failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to mark order as delivered',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/verify-pickup')
  @ApiOperation({ summary: 'Rider verifies 4-digit pickup code provided by restaurant staff' })
  async verifyPickupOtp(
    @Param('id') id: string,
    @Body('otp') otp: string,
    @Request() req: any,
  ) {
    try {
      if (!otp) throw new BadRequestException('Pickup verification code is required.');
      const driver = await this.getDriverFromReq(req);
      if (!driver) throw new ForbiddenException('Authenticated user is not a registered delivery partner.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver.id,
      };

      return await this.stateMachineService.verifyPickupOtp(id, otp, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`verifyPickupOtp failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to verify pickup OTP',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/verify-pickup-qr')
  @ApiOperation({ summary: 'Rider verifies pickup by scanning HMAC signed QR code' })
  async verifyPickupQr(
    @Param('id') id: string,
    @Body('qrToken') qrToken: string,
    @Request() req: any,
  ) {
    try {
      if (!qrToken) throw new BadRequestException('QR verification token is required.');
      const driver = await this.getDriverFromReq(req);
      if (!driver) throw new ForbiddenException('Authenticated user is not a registered delivery partner.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver.id,
      };

      return await this.stateMachineService.verifyPickupQr(id, qrToken, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`verifyPickupQr failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to verify pickup QR token',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/verify-delivery')
  @ApiOperation({ summary: 'Rider verifies 4-digit customer delivery OTP' })
  async verifyDeliveryOtp(
    @Param('id') id: string,
    @Body('otp') otp: string,
    @Request() req: any,
  ) {
    try {
      if (!otp) throw new BadRequestException('Customer delivery OTP is required.');
      const driver = await this.getDriverFromReq(req);
      if (!driver) throw new ForbiddenException('Authenticated user is not a registered delivery partner.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver.id,
      };

      return await this.stateMachineService.verifyDeliveryOtp(id, otp, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`verifyDeliveryOtp failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to verify customer delivery OTP',
        details: err?.stack || String(err),
      });
    }
  }
}
