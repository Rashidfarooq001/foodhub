import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { ORDER_TRANSITIONS } from '@foodhub/types';
import { OrderStatus } from '@prisma/client';
import { ORDER_EVENTS } from './orders.events';

@Injectable()
export class OrderLifecycleService {
  private readonly logger = new Logger(OrderLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorId?: string,
    additionalData?: { riderId?: string; deliveryJobPayload?: any }
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const currentStatus = order.status;

    // Validate transition
    const allowed = ORDER_TRANSITIONS[currentStatus as keyof typeof ORDER_TRANSITIONS] || [];
    if (!allowed.includes(newStatus as keyof typeof ORDER_TRANSITIONS)) {
      throw new BadRequestException(
        `Cannot transition order ${orderId} from ${currentStatus} to ${newStatus}`
      );
    }

    // Specific business rules
    if (newStatus === OrderStatus.OUT_FOR_DELIVERY && currentStatus === OrderStatus.READY_FOR_PICKUP) {
      if (order.restaurant.deliveryMode !== 'RESTAURANT_SELF_DELIVERY') {
         throw new BadRequestException(
           'Platform delivery orders must be assigned to a rider and picked up before moving to OUT_FOR_DELIVERY.'
         );
      }
    }
    
    if (newStatus === OrderStatus.DRIVER_ASSIGNED) {
      if (!additionalData?.riderId) {
        throw new BadRequestException('riderId is required when assigning a driver');
      }
    }

    const updateData: any = { status: newStatus };
    if (newStatus === OrderStatus.DRIVER_ASSIGNED && additionalData?.riderId) {
      updateData.assignedFoodHubDriverId = additionalData.riderId;
    }

    // Perform DB update inside a transaction to ensure History is saved
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      if (additionalData?.deliveryJobPayload) {
        await tx.deliveryJob.upsert({
          where: { orderId: orderId },
          create: additionalData.deliveryJobPayload.create,
          update: additionalData.deliveryJobPayload.update,
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          restaurant: true,
          customer: true,
        },
      });

      // Save history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedBy: actorId,
        },
      });

      // Optionally save timeline
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: newStatus,
          message: `Order status updated to ${newStatus}`,
        }
      });

      return updated;
    });

    this.logger.log(`[OrderLifecycle] ${orderId} transitioned ${currentStatus} -> ${newStatus} by ${actorId}`);

    // Emit the SINGLE source of truth event to all interested parties
    this.ordersGateway.emitToOrder(orderId, ORDER_EVENTS.STATUS_UPDATED, updatedOrder);
    this.ordersGateway.emitToRestaurant(order.restaurantId, ORDER_EVENTS.STATUS_UPDATED, updatedOrder);
    
    const activeDriverId = updatedOrder.assignedFoodHubDriverId || updatedOrder.assignedRestaurantDriverId;
    if (activeDriverId) {
      this.ordersGateway.emitToDriver(activeDriverId, ORDER_EVENTS.STATUS_UPDATED, updatedOrder);
    }
    if (updatedOrder.customerId) {
      this.ordersGateway.emitToUser(updatedOrder.customerId, ORDER_EVENTS.STATUS_UPDATED, updatedOrder);
    }

    return updatedOrder;
  }
}
