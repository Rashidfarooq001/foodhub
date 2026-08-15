import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { OrderStatus, DeliveryJobStatus, UserRole } from '@prisma/client';

export interface AuthenticatedActor {
  userId: string;
  role: string;
  restaurantId?: string;
  driverId?: string;
}

@Injectable()
export class OrderStateMachineService {
  private readonly logger = new Logger(OrderStateMachineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  /**
   * Authoritative Order State Transition Guard
   */
  async transition(
    orderId: string,
    targetStatus: OrderStatus,
    actor: AuthenticatedActor,
    extraData?: { reason?: string; cancellationReason?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        customer: true,
        deliveryJob: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    const currentStatus = order.status;

    // Validate Actor Permission & State Transition Matrix
    this.validateActorPermission(order, currentStatus, targetStatus, actor);

    // Perform Atomic DB Transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Handle Delivery Job state creation/updates
      let updatedJob: any = null;

      if (targetStatus === OrderStatus.READY_FOR_PICKUP) {
        // PREPARING -> READY_FOR_PICKUP: Transactionally create or activate DeliveryJob
        const restLat = order.restaurant.latitude || 34.3868;
        const restLng = order.restaurant.longitude || 74.5221;
        const delAddr = order.deliveryAddress as any;
        const custLat = delAddr?.latitude || 34.3877;
        const custLng = delAddr?.longitude || 74.5228;

        // Calculate distance if needed
        const distanceKm = delAddr?.distanceKm || this.calculateHaversineDistance(restLat, restLng, custLat, custLng);

        const pickupAddress = {
          restaurantName: order.restaurant.name,
          addressLine: order.restaurant.addressLine,
          latitude: restLat,
          longitude: restLng,
          phone: order.restaurant.phone,
        };

        const dropAddress = {
          street: delAddr?.street || delAddr?.addressLine1 || 'Delivery Address',
          addressLine2: delAddr?.addressLine2 || '',
          city: delAddr?.city || 'Bandipora',
          state: delAddr?.state || 'Jammu & Kashmir',
          postalCode: delAddr?.postalCode || '193502',
          latitude: custLat,
          longitude: custLng,
          contactName: order.deliveryAddress ? (delAddr?.name || 'Customer') : 'Customer',
        };

        const riderPayout = Math.max(30, Math.round(Number(order.deliveryFee || 40) * 0.8));

        updatedJob = await tx.deliveryJob.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            status: DeliveryJobStatus.AVAILABLE,
            pickupAddressJson: pickupAddress,
            dropAddressJson: dropAddress,
            distanceKm,
            deliveryFee: order.deliveryFee,
            riderPayout,
            offeredAt: now,
          },
          update: {
            status: DeliveryJobStatus.AVAILABLE,
            offeredAt: now,
          },
        });
      } else if (targetStatus === OrderStatus.DRIVER_ASSIGNED) {
        // Atomic Driver Job Claim
        if (!actor.driverId) {
          throw new ForbiddenException('Only registered delivery partners can accept delivery jobs.');
        }

        // Conditional atomic claim to prevent double booking
        const existingJob = await tx.deliveryJob.findUnique({
          where: { orderId: order.id },
        });

        if (!existingJob) {
          throw new BadRequestException('No active delivery job exists for this order.');
        }

        if (existingJob.status !== DeliveryJobStatus.AVAILABLE || existingJob.driverId) {
          throw new ConflictException('This delivery job has already been claimed by another delivery partner.');
        }

        updatedJob = await tx.deliveryJob.update({
          where: { id: existingJob.id },
          data: {
            driverId: actor.driverId,
            status: DeliveryJobStatus.ASSIGNED,
            acceptedAt: now,
          },
        });
      } else if (targetStatus === OrderStatus.ARRIVED_AT_RESTAURANT) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.ARRIVED,
              arrivedAt: now,
            },
          });
        }
      } else if (targetStatus === OrderStatus.PICKED_UP) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.PICKED_UP,
              pickedAt: now,
            },
          });
        }
      } else if (targetStatus === OrderStatus.DELIVERED) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.DELIVERED,
              deliveredAt: now,
            },
          });
        }
      } else if (targetStatus === OrderStatus.CANCELLED || targetStatus === OrderStatus.REJECTED) {
        if (order.deliveryJob) {
          await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: { status: DeliveryJobStatus.CANCELLED },
          });
        }
      }

      // 2. Update Order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          ...(targetStatus === OrderStatus.DRIVER_ASSIGNED && actor.driverId
            ? { assignedFoodHubDriverId: actor.driverId }
            : {}),
        },
        include: {
          restaurant: true,
          deliveryJob: true,
          orderItems: { include: { foodItem: true } },
        },
      });

      // 3. Record OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          changedBy: actor.userId,
        },
      });

      // 4. Record OrderTimeline
      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: targetStatus,
          message: this.getStatusMessage(targetStatus),
        },
      });

      return updatedOrder;
    });

    // 5. Emit Realtime Events (ONLY AFTER DB TRANSACTION SUCCEEDED)
    this.emitRealtimeEvents(updatedOrder, currentStatus, targetStatus);

    return updatedOrder;
  }

  /**
   * Validate Actor Permission & State Transition Matrix
   */
  private validateActorPermission(
    order: any,
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    actor: AuthenticatedActor,
  ) {
    const role = (actor.role || '').toUpperCase();

    // Admin Override
    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Role Ownership Guards
    if (
      role === UserRole.RESTAURANT_OWNER ||
      role === UserRole.RESTAURANT_MANAGER ||
      role === UserRole.RESTAURANT_STAFF
    ) {
      if (actor.restaurantId && actor.restaurantId !== order.restaurantId) {
        throw new ForbiddenException('Access denied. You do not own this restaurant order.');
      }

      const allowedTransitions: Record<string, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
        [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING],
        [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP],
      };

      const validTargets = allowedTransitions[currentStatus] || [];
      if (!validTargets.includes(targetStatus)) {
        throw new BadRequestException(
          `Restaurant is not authorized to transition order from "${currentStatus}" to "${targetStatus}".`,
        );
      }
      return;
    }

    if (role === UserRole.DELIVERY_PARTNER) {
      if (order.deliveryJob && order.deliveryJob.driverId && order.deliveryJob.driverId !== actor.driverId) {
        throw new ForbiddenException('Access denied. This delivery job belongs to another delivery partner.');
      }

      const allowedTransitions: Record<string, OrderStatus[]> = {
        [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DRIVER_ASSIGNED],
        [OrderStatus.DRIVER_ASSIGNED]: [OrderStatus.ARRIVED_AT_RESTAURANT],
        [OrderStatus.ARRIVED_AT_RESTAURANT]: [OrderStatus.PICKED_UP],
        [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      };

      const validTargets = allowedTransitions[currentStatus] || [];
      if (!validTargets.includes(targetStatus)) {
        throw new BadRequestException(
          `Delivery partner is not authorized to transition order from "${currentStatus}" to "${targetStatus}".`,
        );
      }
      return;
    }

    if (role === UserRole.CUSTOMER) {
      if (order.customerId !== actor.userId) {
        throw new ForbiddenException('Access denied. You do not own this order.');
      }

      if (currentStatus === OrderStatus.PENDING && targetStatus === OrderStatus.CANCELLED) {
        return;
      }

      throw new BadRequestException(
        `Customer can only cancel orders in "PENDING" status. Cannot transition from "${currentStatus}" to "${targetStatus}".`,
      );
    }

    throw new ForbiddenException('Access denied. Unauthorized actor role for order status transition.');
  }

  /**
   * Emit Realtime Socket.IO Events
   */
  private emitRealtimeEvents(order: any, fromStatus: OrderStatus, toStatus: OrderStatus) {
    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurant.name,
      fromStatus,
      status: toStatus,
      updatedAt: order.updatedAt,
      deliveryJob: order.deliveryJob,
    };

    // Emit to order room (customer)
    this.ordersGateway.emitToOrder(order.id, 'order:status-changed' as any, payload);

    // Emit to restaurant room
    this.ordersGateway.emitToRestaurant(order.restaurantId, 'order:status-changed' as any, payload);

    // Emit to driver if assigned
    if (order.assignedFoodHubDriverId) {
      this.ordersGateway.emitToDriver(order.assignedFoodHubDriverId, 'order:status-changed' as any, payload);
    }

    // Specific event triggers
    if (toStatus === OrderStatus.READY_FOR_PICKUP) {
      this.ordersGateway.emitToAdmin('delivery:job-available' as any, payload);
    } else if (toStatus === OrderStatus.DRIVER_ASSIGNED) {
      this.ordersGateway.emitToOrder(order.id, 'delivery:assigned' as any, payload);
    } else if (toStatus === OrderStatus.ARRIVED_AT_RESTAURANT) {
      this.ordersGateway.emitToOrder(order.id, 'delivery:arrived' as any, payload);
    } else if (toStatus === OrderStatus.PICKED_UP) {
      this.ordersGateway.emitToOrder(order.id, 'delivery:picked-up' as any, payload);
    } else if (toStatus === OrderStatus.OUT_FOR_DELIVERY) {
      this.ordersGateway.emitToOrder(order.id, 'delivery:out-for-delivery' as any, payload);
    } else if (toStatus === OrderStatus.DELIVERED) {
      this.ordersGateway.emitToOrder(order.id, 'delivery:delivered' as any, payload);
    }

    // Always notify admin operations
    this.ordersGateway.emitToAdmin('order:status-changed' as any, payload);
  }

  private getStatusMessage(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Order placed. Waiting for restaurant confirmation.';
      case OrderStatus.ACCEPTED:
        return 'Restaurant accepted your order.';
      case OrderStatus.PREPARING:
        return 'Food is being prepared by the kitchen.';
      case OrderStatus.READY_FOR_PICKUP:
        return 'Order is ready for pickup.';
      case OrderStatus.DRIVER_ASSIGNED:
        return 'Delivery partner assigned to your order.';
      case OrderStatus.ARRIVED_AT_RESTAURANT:
        return 'Delivery partner arrived at the restaurant.';
      case OrderStatus.PICKED_UP:
        return 'Order picked up from restaurant.';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Delivery partner is on the way to your location.';
      case OrderStatus.DELIVERED:
        return 'Order delivered successfully. Enjoy your meal!';
      case OrderStatus.REJECTED:
        return 'Order was rejected by the restaurant.';
      case OrderStatus.CANCELLED:
        return 'Order was cancelled.';
      default:
        return `Order status updated to ${status}.`;
    }
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }
}
