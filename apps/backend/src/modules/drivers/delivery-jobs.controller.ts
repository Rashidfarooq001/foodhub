import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';
import { OrderStateMachineService } from '../orders/order-state-machine.service';
import { OrderStatus, DeliveryJobStatus } from '@prisma/client';

@ApiTags('Delivery Jobs Lifecycle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery/jobs')
export class DeliveryJobsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachineService: OrderStateMachineService,
  ) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available delivery jobs for orders ready for pickup' })
  async getAvailableJobs(@Request() req: any) {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'DELIVERY_PARTNER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only delivery partners can view available delivery jobs.');
    }

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: DeliveryJobStatus.AVAILABLE,
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

    return jobs.map((job) => ({
      id: job.id,
      orderId: job.orderId,
      orderNumber: job.order.orderNumber,
      restaurantName: job.order.restaurant.name,
      restaurantAddress: job.order.restaurant.addressLine,
      customerAddress: job.dropAddressJson,
      distanceKm: job.distanceKm,
      riderPayout: Number(job.riderPayout),
      status: job.status,
      offeredAt: job.offeredAt,
    }));
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Rider accepts delivery job (Atomic conditional transaction)' })
  async acceptJob(@Param('id') id: string, @Request() req: any) {
    const driverId = req.user?.driverId;
    if (!driverId) {
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

    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      driverId,
    };

    return this.stateMachineService.transition(job.orderId, OrderStatus.DRIVER_ASSIGNED, actor);
  }

  @Post(':id/arrived')
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

  @Post(':id/picked-up')
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

  @Post(':id/start-delivery')
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

  @Post(':id/delivered')
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
