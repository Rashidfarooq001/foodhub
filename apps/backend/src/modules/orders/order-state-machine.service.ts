import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, DeliveryJobStatus, DriverStatus } from '@prisma/client';

export interface AuthenticatedActor {
  userId?: string;
  role?: string;
  restaurantId?: string;
  driverId?: string;
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return parseFloat((R * c).toFixed(1));
}

@Injectable()
export class OrderStateMachineService {
  private readonly logger = new Logger(OrderStateMachineService.name);

  constructor(private readonly prisma: PrismaService) {}

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return calculateHaversineDistance(lat1, lon1, lat2, lon2);
  }

  private isValidUuid(str?: string | null): boolean {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Explicit Restaurant Assignment of Delivery Partner
   */
  async assignRiderToOrder(
    orderId: string,
    driverId: string,
    actor: AuthenticatedActor,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, deliveryJob: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    const isOwner = order.restaurant.ownerId === actor.userId;
    const isStaff = actor.restaurantId && actor.restaurantId === order.restaurantId;
    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff && !isAdmin) {
      throw new ForbiddenException('Access denied. You do not own or manage this restaurant order.');
    }

    if (!['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status)) {
      throw new BadRequestException(`Cannot assign rider to order in current state "${order.status}".`);
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        status: true,
        isApproved: true,
        user: { select: { id: true, isActive: true, profile: true } },
        deliveryJobs: { select: { id: true, status: true } },
      },
    });

    if (!driver) {
      throw new BadRequestException(`Delivery partner with ID "${driverId}" not found.`);
    }

    if (!driver.isApproved || !driver.user?.isActive) {
      throw new BadRequestException('Selected delivery partner account is not active or approved.');
    }

    if (driver.status === DriverStatus.OFFLINE) {
      throw new BadRequestException('Selected delivery partner is currently OFFLINE.');
    }

    const activeJobs = (driver.deliveryJobs || []).filter((j) =>
      [
        DeliveryJobStatus.ASSIGNED as string,
        DeliveryJobStatus.ARRIVED as string,
        DeliveryJobStatus.PICKED_UP as string,
      ].includes(j.status as string),
    );

    if (activeJobs.length > 0) {
      throw new ConflictException('Selected delivery partner is currently busy executing another delivery.');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const restLat = Number(order.restaurant.latitude || 34.3868);
      const restLng = Number(order.restaurant.longitude || 74.5221);
      const delAddr: any = order.deliveryAddress || {};
      const custLat = Number(delAddr.latitude || 34.3877);
      const custLng = Number(delAddr.longitude || 74.5228);

      const distanceKm = calculateHaversineDistance(restLat, restLng, custLat, custLng);

      const pickupAddress = {
        restaurantName: order.restaurant.name,
        addressLine: order.restaurant.addressLine,
        latitude: restLat,
        longitude: restLng,
        phone: order.restaurant.phone,
      };

      const dropAddress = {
        street: delAddr.street || delAddr.addressLine1 || 'Delivery Address',
        addressLine2: delAddr.addressLine2 || '',
        city: delAddr.city || 'Bandipora',
        state: delAddr.state || 'Jammu & Kashmir',
        postalCode: delAddr.postalCode || '193502',
        latitude: custLat,
        longitude: custLng,
        contactName: delAddr.name || 'Customer',
      };

      const riderPayout = Math.max(30, Math.round(Number(order.deliveryFee || 40) * 0.8));

      await tx.deliveryJob.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          driverId: driver.id,
          status: DeliveryJobStatus.ASSIGNED,
          pickupAddressJson: pickupAddress,
          dropAddressJson: dropAddress,
          distanceKm,
          deliveryFee: order.deliveryFee,
          riderPayout,
        },
        update: {
          driverId: driver.id,
          status: DeliveryJobStatus.ASSIGNED,
        },
        select: { id: true, status: true },
      });

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DRIVER_ASSIGNED,
        },
        include: {
          restaurant: true,
          deliveryJob: {
            select: {
              id: true,
              status: true,
              driverId: true,
              driver: {
                select: {
                  id: true,
                  status: true,
                  isApproved: true,
                  user: { select: { id: true, profile: true } },
                },
              },
            },
          },
          orderItems: true,
        },
      });

      const validActorUserId = this.isValidUuid(actor.userId) ? actor.userId : null;
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.DRIVER_ASSIGNED,
          changedBy: validActorUserId,
        },
      });

      const driverName = driver.user?.profile
        ? `${driver.user.profile.firstName} ${driver.user.profile.lastName || ''}`.trim()
        : 'Partner';

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: OrderStatus.DRIVER_ASSIGNED,
          message: `Restaurant assigned FoodHub delivery partner: ${driverName}.`,
        },
      });

      return updated;
    });

    this.emitRealtimeEvents(updatedOrder, order.status, OrderStatus.DRIVER_ASSIGNED);

    return updatedOrder;
  }

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

    this.validateActorPermission(order, currentStatus, targetStatus, actor);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const liveOrder = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });

      if (!liveOrder || liveOrder.status !== currentStatus) {
        throw new ConflictException(
          `Order status has already been updated to "${liveOrder?.status || 'UNKNOWN'}" by another process.`,
        );
      }

      let updatedJob: any = null;

      if (targetStatus === OrderStatus.READY_FOR_PICKUP) {
        const restLat = Number(order.restaurant.latitude || 34.3868);
        const restLng = Number(order.restaurant.longitude || 74.5221);
        const delAddr = order.deliveryAddress as any;
        const custLat = Number(delAddr?.latitude || 34.3877);
        const custLng = Number(delAddr?.longitude || 74.5228);

        const distanceKm = delAddr?.distanceKm || calculateHaversineDistance(restLat, restLng, custLat, custLng);

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
          },
          update: {
            status: DeliveryJobStatus.AVAILABLE,
          },
          select: { id: true, status: true },
        });
      } else if (targetStatus === OrderStatus.DRIVER_ASSIGNED) {
        if (!actor.driverId) {
          throw new ForbiddenException('Only registered delivery partners can accept delivery jobs.');
        }

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
          },
          select: { id: true, status: true },
        });
      } else if (targetStatus === OrderStatus.ARRIVED_AT_RESTAURANT) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.ARRIVED,
            },
            select: { id: true, status: true },
          });
        }
      } else if (targetStatus === OrderStatus.PICKED_UP) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.PICKED_UP,
            },
            select: { id: true, status: true },
          });
        }
      } else if (targetStatus === OrderStatus.DELIVERED) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.DELIVERED,
            },
            select: { id: true, status: true },
          });
        }
      } else if (targetStatus === OrderStatus.CANCELLED || targetStatus === OrderStatus.REJECTED) {
        if (order.deliveryJob) {
          await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: { status: DeliveryJobStatus.CANCELLED },
            select: { id: true, status: true },
          });
        }
      }

      const updatedOrderRecord = await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          ...(targetStatus === OrderStatus.DELIVERED ? { isPaid: true } : {}),
        },
        include: {
          restaurant: true,
          deliveryJob: {
            select: {
              id: true,
              status: true,
              driverId: true,
              driver: {
                select: {
                  id: true,
                  status: true,
                  isApproved: true,
                  user: { select: { id: true, profile: true } },
                },
              },
            },
          },
          orderItems: { include: { foodItem: true } },
        },
      });

      const validActorUserId = this.isValidUuid(actor.userId) ? actor.userId : null;
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          changedBy: validActorUserId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: targetStatus,
          message: this.getTimelineMessage(targetStatus, extraData?.reason),
        },
      });

      return updatedOrderRecord;
    });

    this.emitRealtimeEvents(updatedOrder, currentStatus, targetStatus);

    return updatedOrder;
  }

  private validateActorPermission(
    order: any,
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    actor: AuthenticatedActor,
  ) {
    const isCustomer = actor.userId === order.customerId;
    const isRestaurantOwner = actor.userId === order.restaurant.ownerId;
    const isRestaurantStaff = actor.restaurantId === order.restaurantId;
    const isAssignedDriver = actor.driverId && order.deliveryJob?.driverId === actor.driverId;
    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';

    const isRestaurantActor = isRestaurantOwner || isRestaurantStaff || isAdmin;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
      READY_FOR_PICKUP: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.CANCELLED],
      DRIVER_ASSIGNED: [OrderStatus.ARRIVED_AT_RESTAURANT, OrderStatus.CANCELLED],
      ARRIVED_AT_RESTAURANT: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      PICKED_UP: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      DELIVERED: [],
      REJECTED: [],
      CANCELLED: [],
      FAILED: [],
      REFUNDED: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from "${currentStatus}" to "${targetStatus}".`,
      );
    }

    if (targetStatus === OrderStatus.ACCEPTED || targetStatus === OrderStatus.REJECTED) {
      if (!isRestaurantActor) {
        throw new ForbiddenException('Only the restaurant owner or staff can accept/reject this order.');
      }
    }

    if (targetStatus === OrderStatus.PREPARING || targetStatus === OrderStatus.READY_FOR_PICKUP) {
      if (!isRestaurantActor) {
        throw new ForbiddenException('Only the restaurant can update cooking preparation stages.');
      }
    }

    if (
      (
        [
          OrderStatus.ARRIVED_AT_RESTAURANT,
          OrderStatus.PICKED_UP,
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
        ] as OrderStatus[]
      ).includes(targetStatus)
    ) {
      if (!isAssignedDriver && !isAdmin) {
        throw new ForbiddenException('Only the assigned delivery partner can update trip progress.');
      }
    }
  }

  private emitRealtimeEvents(order: any, fromStatus: OrderStatus, toStatus: OrderStatus) {
    this.logger.log(`[STATE MACHINE EVENT] Order #${order.orderNumber} transitioned from ${fromStatus} to ${toStatus}`);
  }

  private getTimelineMessage(status: OrderStatus, reason?: string): string {
    switch (status) {
      case OrderStatus.ACCEPTED:
        return 'Restaurant accepted order and sent to kitchen.';
      case OrderStatus.REJECTED:
        return `Restaurant rejected order. Reason: ${reason || 'Not specified'}.`;
      case OrderStatus.PREPARING:
        return 'Chef started preparing items in kitchen queue.';
      case OrderStatus.READY_FOR_PICKUP:
        return 'Order is packed and ready for delivery partner pickup.';
      case OrderStatus.DRIVER_ASSIGNED:
        return 'FoodHub delivery partner assigned to order.';
      case OrderStatus.ARRIVED_AT_RESTAURANT:
        return 'Delivery partner arrived at restaurant for pickup.';
      case OrderStatus.PICKED_UP:
        return 'Delivery partner picked up food package from restaurant.';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Rider is on the way to customer delivery location.';
      case OrderStatus.DELIVERED:
        return 'Order delivered successfully to customer.';
      case OrderStatus.CANCELLED:
        return `Order cancelled. Reason: ${reason || 'Not specified'}.`;
      default:
        return `Order status updated to ${status}.`;
    }
  }
}
