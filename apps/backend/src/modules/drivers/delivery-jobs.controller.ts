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
import { OrdersGateway } from '../orders/orders.gateway';
import { ORDER_EVENTS } from '../orders/orders.events';
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
    private readonly ordersGateway: OrdersGateway,
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

      const activeJobs = (driver.deliveryJobs || []).filter((j) =>
        [
          DeliveryJobStatus.ASSIGNED as string,
          DeliveryJobStatus.ARRIVED as string,
          DeliveryJobStatus.PICKED_UP as string,
        ].includes(j.status as string),
      );

      const maxActiveOrders = parseInt(process.env.RIDER_MAX_ACTIVE_ORDERS || '10', 10);

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
      } else if (activeJobs.length >= maxActiveOrders) {
        operationalStatus = 'BUSY';
        unavailabilityReason = `Rider has reached max capacity (${maxActiveOrders} active orders)`;
      }

      return {
        driverId: driver.id,
        userId: driver.userId,
        operationalStatus,
        dutyStatus: driver.status === DriverStatus.ONLINE ? 'ONLINE' : 'OFFLINE',
        isAvailable: operationalStatus === 'ONLINE_AVAILABLE' || (operationalStatus !== 'SUSPENDED' && operationalStatus !== 'PENDING_APPROVAL' && operationalStatus !== 'OFFLINE' && operationalStatus !== 'BUSY'),
        unavailabilityReason,
        isApproved: driver.isApproved,
        activeOrderCount: activeJobs.length,
        activeDeliveries: activeJobs.map((j) => ({
          jobId: j.id,
          orderId: j.orderId,
          orderNumber: j.order?.orderNumber,
          status: j.status,
        })),
        // Legacy field — first active job for backwards compat
        activeDelivery: activeJobs.length > 0
          ? {
              jobId: activeJobs[0].id,
              orderId: activeJobs[0].orderId,
              orderNumber: activeJobs[0].order?.orderNumber,
              status: activeJobs[0].status,
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

      await this.prisma.driver.update({
        where: { id: driver.id },
        data: {
          status: DriverStatus.ONLINE,
        },
      });

      this.logger.log(`[PRESENCE] driver=${driver.id.slice(0, 8)} action=ONLINE databaseStatus=ONLINE socketBroadcast=true`);

      this.ordersGateway.emitToAdmin(ORDER_EVENTS.DRIVER_STATUS_CHANGED, {
        driverId: driver.id,
        dutyStatus: 'ONLINE',
        operationalStatus: 'ONLINE_AVAILABLE',
        timestamp: new Date().toISOString(),
      });

      this.ordersGateway.emitToDriver(driver.id, ORDER_EVENTS.DRIVER_STATUS_CHANGED, {
        driverId: driver.id,
        dutyStatus: 'ONLINE',
        operationalStatus: 'ONLINE_AVAILABLE',
        timestamp: new Date().toISOString(),
      });

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

      await this.prisma.driver.update({
        where: { id: driver.id },
        data: {
          status: DriverStatus.OFFLINE,
        },
      });

      this.logger.log(`[PRESENCE] driver=${driver.id.slice(0, 8)} action=OFFLINE databaseStatus=OFFLINE socketBroadcast=true`);

      this.ordersGateway.emitToAdmin(ORDER_EVENTS.DRIVER_STATUS_CHANGED, {
        driverId: driver.id,
        dutyStatus: 'OFFLINE',
        operationalStatus: 'OFFLINE',
        timestamp: new Date().toISOString(),
      });

      this.ordersGateway.emitToDriver(driver.id, ORDER_EVENTS.DRIVER_STATUS_CHANGED, {
        driverId: driver.id,
        dutyStatus: 'OFFLINE',
        operationalStatus: 'OFFLINE',
        timestamp: new Date().toISOString(),
      });

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
          `UPDATE drivers SET current_lat = $1, current_lng = $2, last_seen_at = NOW() WHERE id = $3::uuid`,
          lat,
          lng,
          driver.id,
        );
      } else {
        await this.prisma.$executeRawUnsafe(
          `UPDATE drivers SET last_seen_at = NOW() WHERE id = $1::uuid`,
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

    const driver = await this.getDriverFromReq(req);
    let rejectedJobIds: string[] = [];
    if (driver) {
      const rejections = await this.prisma.deliveryJobRejection.findMany({
        where: { driverId: driver.id },
        select: { deliveryJobId: true }
      });
      rejectedJobIds = rejections.map(r => r.deliveryJobId);
    }

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: DeliveryJobStatus.AVAILABLE,
        driverId: null,
        order: {
          status: OrderStatus.READY_FOR_PICKUP,
        },
        id: {
          notIn: rejectedJobIds
        }
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
        restaurantLat: job.order.restaurant.latitude !== null ? Number(job.order.restaurant.latitude) : null,
        restaurantLng: job.order.restaurant.longitude !== null ? Number(job.order.restaurant.longitude) : null,
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

  private formatJobPayload(job: any) {
    const pickupAddr: any = job.pickupAddressJson || {};
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

    const customerPhone = job.order?.customer?.user?.phone || dropAddr.phone || null;

    const restLat = job.order?.restaurant?.latitude !== null && job.order?.restaurant?.latitude !== undefined ? Number(job.order.restaurant.latitude) : null;
    const restLng = job.order?.restaurant?.longitude !== null && job.order?.restaurant?.longitude !== undefined ? Number(job.order.restaurant.longitude) : null;
    const custLat = dropAddr.latitude !== null && dropAddr.latitude !== undefined ? Number(dropAddr.latitude) : null;
    const custLng = dropAddr.longitude !== null && dropAddr.longitude !== undefined ? Number(dropAddr.longitude) : null;

    return {
      id: job.id,
      orderId: job.orderId,
      orderNumber: job.order?.orderNumber || 'FH-ORDER',
      status: job.order?.status,
      jobStatus: job.status,
      paymentMethod: job.order?.paymentMethod,
      codAmountToCollect: job.order?.paymentMethod === 'COD' ? Number(job.order.totalAmount) : 0,
      estimatedEarnings: Number(job.riderPayout || 40),
      riderPayout: Number(job.riderPayout || 40),
      restaurantName: job.order?.restaurant?.name || 'Restaurant Kitchen',
      restaurantAddress: job.order?.restaurant?.addressLine,
      restaurantPhone: job.order?.restaurant?.phone,
      restaurantLat: restLat,
      restaurantLng: restLng,
      customerName,
      customerAddress: dropAddressText,
      customerPhone,
      customerLat: custLat,
      customerLng: custLng,
      distanceKm: job.distanceKm,
      items: (job.order?.orderItems || []).map((item: any) => ({
        name: item.foodItem?.name || 'Item',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  @Get('active-jobs')
  @ApiOperation({ summary: 'Get all active concurrent delivery jobs for authenticated driver' })
  async getActiveJobs(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) {
      throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
    }

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        order: {
          assignedFoodHubDriverId: driver.id,
          status: {
            in: [
              OrderStatus.DRIVER_ASSIGNED,
              OrderStatus.ARRIVED_AT_RESTAURANT,
              OrderStatus.PICKED_UP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
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

    return jobs.map((job) => this.formatJobPayload(job));
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
        order: {
          assignedFoodHubDriverId: driver.id,
          status: {
            in: [
              OrderStatus.DRIVER_ASSIGNED,
              OrderStatus.ARRIVED_AT_RESTAURANT,
              OrderStatus.PICKED_UP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
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
    return this.formatJobPayload(job);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get earnings & delivery statistics for driver' })
  async getDriverStats(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) {
      return {
        todayEarnings: 0,
        completedDeliveries: 0,
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

    const completedOrders = await this.prisma.order.findMany({
      where: {
        assignedFoodHubDriverId: driver.id,
        status: 'DELIVERED',
      },
      include: {
        deliveryJob: true,
      },
    });

    const todayOrders = completedOrders.filter((o) => o.updatedAt && o.updatedAt >= todayStart);
    const todayEarnings = todayOrders.reduce((sum, o) => sum + Number(o.deliveryJob?.riderPayout || 0), 0);
    const totalEarnings = completedOrders.reduce((sum, o) => sum + Number(o.deliveryJob?.riderPayout || 0), 0);

    const pendingSettlement = totalEarnings;
    const availableForSettlement = totalEarnings;
    const settledAmount = 0;

    return {
      todayEarnings,
      completedDeliveries: todayOrders.length,
      weeklyEarnings: totalEarnings,
      monthlyEarnings: totalEarnings,
      totalEarnings,
      pendingSettlement,
      availableForSettlement,
      settledAmount,
      acceptanceRate: 96,
      completionRate: 100,
      avgRating: Number(driver.avgRating) > 0 ? Number(driver.avgRating) : 5.0,
      totalRatings: completedOrders.length,
      dutyStatus: driver.status === DriverStatus.OFFLINE ? 'OFFLINE' : 'ONLINE',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed delivery history for driver' })
  async getDriverHistory(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) return [];

    const completedOrders = await this.prisma.order.findMany({
      where: {
        assignedFoodHubDriverId: driver.id,
        status: 'DELIVERED',
      },
      include: {
        restaurant: { select: { name: true } },
        deliveryJob: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return completedOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      restaurantName: o.restaurant?.name || '',
      distanceKm: o.deliveryJob?.distanceKm || 0,
      riderPayout: Number(o.deliveryJob?.riderPayout || 0),
      deliveredAt: o.updatedAt,
      status: 'DELIVERED',
    }));
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available delivery jobs (alias)' })
  async getAvailableJobsAlias(@Request() req: any) {
    return this.getAvailableJobs(req);
  }

  @Patch('duty-status')
  @ApiOperation({ summary: 'Toggle driver online/offline duty status' })
  async toggleDutyStatus(@Body('status') status: string, @Request() req: any) {
    if (status === 'ONLINE') return this.goOnline(req);
    if (status === 'OFFLINE') return this.goOffline(req);
    throw new BadRequestException('Invalid status value. Use "ONLINE" or "OFFLINE".');
  }

  @Post('duty/toggle')
  @ApiOperation({ summary: 'Toggle driver duty online/offline (alias)' })
  async toggleDutyPost(@Body('isOnline') isOnline: boolean, @Body('status') status: string, @Request() req: any) {
    const shouldGoOnline = isOnline === true || status === 'ONLINE';
    if (shouldGoOnline) {
      return this.goOnline(req);
    } else {
      return this.goOffline(req);
    }
  }

  @Post('jobs/:id/decline')
  @ApiOperation({ summary: 'Rider declines an available delivery job' })
  async declineJob(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
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
        throw new ConflictException('This delivery job is no longer available.');
      }

      await this.prisma.deliveryJobRejection.upsert({
        where: {
          deliveryJobId_driverId: {
            deliveryJobId: job.id,
            driverId: driver.id,
          },
        },
        create: {
          deliveryJobId: job.id,
          driverId: driver.id,
          rejectionReason: reason || null,
        },
        update: {
          rejectionReason: reason || null,
          rejectedAt: new Date(),
        },
      });

      return { success: true, message: 'Job declined successfully.' };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`declineJob failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to decline delivery job',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Rider accepts delivery job (Atomic conditional transaction)' })
  async acceptJob(@Param('id') id: string, @Request() req: any) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) {
        throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
      }

      const activeJobCount = await this.prisma.deliveryJob.count({
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

      const maxActiveOrders = parseInt(process.env.RIDER_MAX_ACTIVE_ORDERS || '10', 10);
      if (activeJobCount >= maxActiveOrders) {
        throw new ConflictException(`You have reached the maximum of ${maxActiveOrders} simultaneous active deliveries. Complete one before accepting another.`);
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

  @Post('jobs/:id/arrived-at-customer')
  @ApiOperation({ summary: 'Rider signals arrival at customer delivery location' })
  async arrivedAtCustomer(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) throw new ForbiddenException('Authenticated user is not a registered delivery partner.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver.id,
      };

      return await this.stateMachineService.riderArrivedAtCustomer(id, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`arrivedAtCustomer failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to record arrival at customer location',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('orders/:orderId/arrived')
  @ApiOperation({ summary: 'Rider signals arrival at customer delivery location (order alias)' })
  async arrivedAtCustomerAlias(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    return this.arrivedAtCustomer(orderId, req);
  }

  @Post('jobs/:id/complete-delivery')
  @ApiOperation({ summary: 'Rider confirms delivery completion' })
  async completeDelivery(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    try {
      const driver = await this.getDriverFromReq(req);
      if (!driver) throw new ForbiddenException('Authenticated user is not a registered delivery partner.');

      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        driverId: driver.id,
      };

      return await this.stateMachineService.completeDelivery(id, actor);
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException || err instanceof ConflictException) {
        throw err;
      }
      this.logger.error(`completeDelivery failed: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to complete delivery',
        details: err?.stack || String(err),
      });
    }
  }

  @Post('orders/:id/complete-delivery')
  @ApiOperation({ summary: 'Rider confirms delivery completion (order alias)' })
  async completeDeliveryAlias(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.completeDelivery(id, req);
  }

  @Post('jobs/:id/unassign')
  @ApiOperation({ summary: 'Unassign driver from delivery job and return to pool' })
  async unassignJob(@Param('id') id: string, @Request() req: any) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    });
    if (!job) throw new NotFoundException('Delivery job not found.');

    const driver = await this.getDriverFromReq(req);
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isAdmin && (!driver || job.driverId !== driver.id)) {
      throw new ForbiddenException('You do not have permission to unassign this delivery job.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryJob.update({
        where: { id: job.id },
        data: {
          driverId: null,
          status: DeliveryJobStatus.AVAILABLE,
          acceptedAt: null,
          arrivedAt: null,
          pickedAt: null,
        },
      });

      await tx.order.update({
        where: { id: job.orderId },
        data: {
          status: OrderStatus.READY_FOR_PICKUP,
          assignedRestaurantDriverId: null,
        },
      });
    });

    return { success: true, message: 'Delivery job unassigned successfully.' };
  }

  @Post('jobs/reset-my-active')
  @ApiOperation({ summary: 'Reset active assigned jobs for current rider' })
  async resetMyActiveJobs(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) throw new ForbiddenException('Authenticated user is not a registered delivery partner.');

    const activeJobs = await this.prisma.deliveryJob.findMany({
      where: {
        driverId: driver.id,
        status: { in: [DeliveryJobStatus.ASSIGNED, DeliveryJobStatus.ARRIVED, DeliveryJobStatus.PICKED_UP] },
      },
    });

    for (const job of activeJobs) {
      await this.prisma.$transaction(async (tx) => {
        await tx.deliveryJob.update({
          where: { id: job.id },
          data: {
            driverId: null,
            status: DeliveryJobStatus.AVAILABLE,
            acceptedAt: null,
            arrivedAt: null,
            pickedAt: null,
          },
        });

        await tx.order.update({
          where: { id: job.orderId },
          data: {
            status: OrderStatus.READY_FOR_PICKUP,
            assignedRestaurantDriverId: null,
          },
        });
      });
    }

    return { success: true, message: `Unassigned ${activeJobs.length} active delivery jobs.`, count: activeJobs.length };
  }

  @Post('admin/unassign-all')
  @ApiOperation({ summary: 'Admin unassigns all assigned active rider jobs' })
  async unassignAllRiderJobs(@Request() req: any) {
    const assignedJobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: { in: [DeliveryJobStatus.ASSIGNED, DeliveryJobStatus.ARRIVED, DeliveryJobStatus.PICKED_UP] },
      },
    });

    for (const job of assignedJobs) {
      await this.prisma.$transaction(async (tx) => {
        await tx.deliveryJob.update({
          where: { id: job.id },
          data: {
            driverId: null,
            status: DeliveryJobStatus.AVAILABLE,
            acceptedAt: null,
            arrivedAt: null,
            pickedAt: null,
          },
        });

        await tx.order.update({
          where: { id: job.orderId },
          data: {
            status: OrderStatus.READY_FOR_PICKUP,
            assignedRestaurantDriverId: null,
          },
        });
      });
    }

    return {
      success: true,
      message: `Successfully unassigned ${assignedJobs.length} active delivery jobs across all riders.`,
      count: assignedJobs.length,
    };
  }
}
