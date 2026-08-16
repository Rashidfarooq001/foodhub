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
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
    }

    const job = await this.prisma.deliveryJob.findFirst({
      where: {
        driverId,
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
    const driverId = req.user?.driverId;
    if (!driverId) {
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
        driverId,
        status: DeliveryJobStatus.DELIVERED,
      },
    });

    const todayJobs = completedJobs.filter((j) => j.deliveredAt && j.deliveredAt >= todayStart);
    const todayEarnings = todayJobs.reduce((sum, j) => sum + Number(j.riderPayout || 0), 0);
    const totalEarnings = completedJobs.reduce((sum, j) => sum + Number(j.riderPayout || 0), 0);

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { status: true },
    });

    return {
      todayEarnings,
      todayDeliveries: todayJobs.length,
      weeklyEarnings: totalEarnings,
      monthlyEarnings: totalEarnings,
      acceptanceRate: 100,
      completionRate: 100,
      avgRating: 4.9,
      totalRatings: completedJobs.length,
      walletBalance: totalEarnings,
      dutyStatus: driver?.status === DriverStatus.OFFLINE ? 'OFFLINE' : 'ONLINE',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get completed delivery history for driver' })
  async getDriverHistory(@Request() req: any) {
    const driverId = req.user?.driverId;
    if (!driverId) return [];

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        driverId,
        status: DeliveryJobStatus.DELIVERED,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            restaurant: { select: { name: true } },
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50,
    });

    return jobs.map((j) => ({
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
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
    }

    const targetStatus = status === 'ONLINE' ? DriverStatus.ONLINE : DriverStatus.OFFLINE;

    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: targetStatus },
    });

    return {
      message: `Duty status updated to ${updated.status}`,
      dutyStatus: updated.status === DriverStatus.OFFLINE ? 'OFFLINE' : 'ONLINE',
    };
  }

  @Post('jobs/:id/accept')
  @ApiOperation({ summary: 'Rider accepts delivery job (Atomic conditional transaction)' })
  async acceptJob(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user?.driverId;
    if (!driverId) {
      throw new ForbiddenException('Authenticated user is not a registered delivery partner.');
    }

    // Check active delivery protection: ONE active delivery per rider
    const activeJob = await this.prisma.deliveryJob.findFirst({
      where: {
        driverId,
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
      driverId,
    };

    return this.stateMachineService.transition(job.orderId, OrderStatus.DRIVER_ASSIGNED, actor);
  }

  @Post('jobs/:id/arrived')
  @ApiOperation({ summary: 'Rider arrives at pickup restaurant' })
  async arrivedAtRestaurant(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user?.driverId;
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    });
    if (!job) throw new NotFoundException('Delivery job not found.');

    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      driverId,
    };

    return this.stateMachineService.transition(job.orderId, OrderStatus.ARRIVED_AT_RESTAURANT, actor);
  }

  @Post('jobs/:id/picked-up')
  @ApiOperation({ summary: 'Rider picks up order from restaurant' })
  async pickedUpOrder(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user?.driverId;
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    });
    if (!job) throw new NotFoundException('Delivery job not found.');

    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      driverId,
    };

    return this.stateMachineService.transition(job.orderId, OrderStatus.PICKED_UP, actor);
  }

  @Post('jobs/:id/start-delivery')
  @ApiOperation({ summary: 'Rider starts delivery to customer location' })
  async startDelivery(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user?.driverId;
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    });
    if (!job) throw new NotFoundException('Delivery job not found.');

    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      driverId,
    };

    return this.stateMachineService.transition(job.orderId, OrderStatus.OUT_FOR_DELIVERY, actor);
  }

  @Post('jobs/:id/delivered')
  @ApiOperation({ summary: 'Rider marks order as delivered to customer' })
  async markDelivered(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user?.driverId;
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id }, { orderId: id }] },
    });
    if (!job) throw new NotFoundException('Delivery job not found.');

    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      driverId,
    };

    return this.stateMachineService.transition(job.orderId, OrderStatus.DELIVERED, actor);
  }
}
