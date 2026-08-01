import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems:     { include: { foodItem: true } },
        orderTimelines: { orderBy: { createdAt: 'asc' } },
        payments:       true,
        cancellation:   true,
        refund:         true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { orderItems: true, orderTimelines: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);
    return order;
  }

  async findByCustomer(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.order.findMany({
      where:   { customerId, deletedAt: null },
      include: { orderItems: { include: { foodItem: true } }, orderTimelines: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
    });
  }

  async findByRestaurant(
    restaurantId: string,
    status?: any,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    let statusFilter: any = undefined;
    if (typeof status === 'string' && status.includes(',')) {
      statusFilter = { in: status.split(',').map((s) => s.trim()) };
    } else if (status) {
      statusFilter = status;
    }

    return this.prisma.order.findMany({
      where:   { restaurantId, ...(statusFilter ? { status: statusFilter } : {}), deletedAt: null },
      include: { orderItems: { include: { foodItem: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
    });
  }

  async findAll(status?: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    let statusFilter: any = undefined;
    if (typeof status === 'string' && status.includes(',')) {
      statusFilter = { in: status.split(',').map((s) => s.trim()) };
    } else if (status) {
      statusFilter = status;
    }

    return this.prisma.order.findMany({
      where:   { ...(statusFilter ? { status: statusFilter } : {}), deletedAt: null },
      include: { orderItems: { include: { foodItem: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    limit,
    });
  }

  async findByDriver(driverId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.deliveryAssignment.findMany({
      where:   { driverId },
      include: { order: { include: { orderItems: true } } },
      orderBy: { offeredAt: 'desc' },
      skip,
      take:    limit,
    });
  }

  async appendTimeline(
    orderId: string,
    status: OrderStatus,
    message?: string,
  ) {
    return this.prisma.orderTimeline.create({
      data: { orderId, status, message },
    });
  }

  async appendStatusHistory(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    changedBy?: string,
  ) {
    return this.prisma.orderStatusHistory.create({
      data: { orderId, fromStatus, toStatus, changedBy },
    });
  }
}
