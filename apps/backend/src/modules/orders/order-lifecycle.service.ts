import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { ORDER_EVENTS } from './orders.events';
import { OrderStatus, DeliveryJobStatus, DriverStatus } from '@prisma/client';
import * as crypto from 'crypto';


export interface AuthenticatedActor {
  userId?: string;
  role?: string;
  restaurantId?: string;
  driverId?: string;
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

export function generate4DigitOtp(): string {
  return crypto.randomInt(1000, 10000).toString();
}

export function signQrToken(payload: {
  orderId: string;
  deliveryJobId: string;
  restaurantId: string;
  driverId: string;
  expiresAt: number;
}): string {
  const secret = process.env.JWT_SECRET || 'foodhub_super_secret_jwt_key_2026';
  const dataStr = `${payload.orderId}:${payload.deliveryJobId}:${payload.restaurantId}:${payload.driverId}:${payload.expiresAt}`;
  const signature = crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
  return Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64url');
}

export function verifyQrToken(token: string): {
  orderId: string;
  deliveryJobId: string;
  restaurantId: string;
  driverId: string;
  expiresAt: number;
} | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    const { orderId, deliveryJobId, restaurantId, driverId, expiresAt, signature } = parsed;
    if (!orderId || !deliveryJobId || !restaurantId || !driverId || !expiresAt || !signature)
      return null;
    if (Date.now() > expiresAt) return null;

    const secret = process.env.JWT_SECRET || 'foodhub_super_secret_jwt_key_2026';
    const dataStr = `${orderId}:${deliveryJobId}:${restaurantId}:${driverId}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
    if (signature !== expectedSig) return null;

    return { orderId, deliveryJobId, restaurantId, driverId, expiresAt };
  } catch {
    return null;
  }
}

@Injectable()
export class OrderLifecycleService {
  private readonly logger = new Logger(OrderLifecycleService.name);

  
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, actorId?: string, additionalData?: { riderId?: string; deliveryJobPayload?: any }) { const actor: AuthenticatedActor = { userId: actorId }; if (additionalData?.riderId) actor.driverId = additionalData.riderId; return this.transition(orderId, newStatus, actor, { deliveryJobPayload: additionalData?.deliveryJobPayload }); }


  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
    
  ) {}

  private isValidUuid(str?: string | null): boolean {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Explicit Restaurant Assignment of Delivery Partner
   */
  async assignRiderToOrder(orderId: string, driverId: string, actor: AuthenticatedActor) {
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
      throw new ForbiddenException(
        'Access denied. You do not own or manage this restaurant order.',
      );
    }

    if (!['PENDING', 'ACCEPTED', 'PREPARING', 'DRIVER_ASSIGNED'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot assign rider to order in current state "${order.status}".`,
      );
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

    const maxActiveOrders = parseInt(process.env.RIDER_MAX_ACTIVE_ORDERS || '10', 10);
    if (activeJobs.length >= maxActiveOrders) {
      throw new ConflictException(
        `Selected delivery partner has reached the maximum of ${maxActiveOrders} simultaneous active orders.`,
      );
    }

    const rawPickupOtp = generate4DigitOtp();
    const pickupOtpHash = hashOtp(rawPickupOtp);
    const pickupOtpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const restLat = Number(order.restaurant.latitude || 0);
    const restLng = Number(order.restaurant.longitude || 74.5221);
    const delAddr: any = order.deliveryAddress || {};
    const custLat = Number(delAddr.latitude || 0);
    const custLng = Number(delAddr.longitude || 74.5228);

    const distanceKm = delAddr?.distanceKm || 0;

    const pickupAddress = {
      restaurantName: order.restaurant.name,
      addressLine: order.restaurant.addressLine,
      latitude: restLat,
      longitude: restLng,
      phone: order.restaurant.phone,
      rawPickupOtp, // Stored safely for restaurant lookup only
    };

    const dropAddress = {
      street: delAddr.street || delAddr.addressLine1 || 'Delivery Address',
      addressLine2: delAddr.addressLine2 || '',
      city: delAddr.city || '',
      state: delAddr.state || 'Jammu & Kashmir',
      postalCode: delAddr.postalCode || '193502',
      latitude: custLat,
      longitude: custLng,
      contactName: delAddr.name || 'Customer',
    };

    const riderPayout = Math.max(30, Math.round(Number(order.deliveryFee || 40) * 0.8));

    const deliveryJobPayload = {
      create: {
        orderId: order.id,
        driverId: driver.id,
        status: DeliveryJobStatus.ASSIGNED,
        pickupAddressJson: pickupAddress,
        dropAddressJson: dropAddress,
        distanceKm,
        deliveryFee: order.deliveryFee,
        riderPayout,
        pickupOtpHash,
        pickupOtpExpiresAt,
        pickupOtpAttempts: 0,
      },
      update: {
        driverId: driver.id,
        status: DeliveryJobStatus.ASSIGNED,
        pickupAddressJson: pickupAddress,
        pickupOtpHash,
        pickupOtpExpiresAt,
        pickupOtpAttempts: 0,
      },
    };

    const updatedOrder = await this.updateOrderStatus(
      order.id,
      OrderStatus.DRIVER_ASSIGNED,
      actor.userId,
      {
        riderId: driver.id,
        deliveryJobPayload,
      },
    );

    return updatedOrder;
  }

  /**
   * Authoritative Restaurant Retrieval of Pickup OTP & Signed QR Code
   */
  async getRestaurantPickupOtp(orderId: string, actor: AuthenticatedActor) {
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
      throw new ForbiddenException(
        'Access denied. Only authorized restaurant staff can retrieve the pickup verification code.',
      );
    }

    const job = order.deliveryJob;
    if (!job || !job.driverId) {
      throw new BadRequestException('No delivery job or driver assigned to this order yet.');
    }

    const pickupAddr: any = job.pickupAddressJson || {};
    let pickupOtp = pickupAddr.rawPickupOtp;
    if (!pickupOtp) {
      pickupOtp = generate4DigitOtp();
      const pickupOtpHash = hashOtp(pickupOtp);
      await this.prisma.deliveryJob.update({
        where: { id: job.id },
        data: {
          pickupOtpHash,
          pickupOtpExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          pickupAddressJson: { ...pickupAddr, rawPickupOtp: pickupOtp },
        },
      });
    }

    const expiresAt = Date.now() + 30 * 60 * 1000;
    const qrToken = signQrToken({
      orderId: order.id,
      deliveryJobId: job.id,
      restaurantId: order.restaurantId,
      driverId: job.driverId,
      expiresAt,
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      pickupOtp,
      qrToken,
      expiresAt,
    };
  }

  /**
   * Rider Submits Pickup OTP to Transition Order ARRIVED_AT_RESTAURANT -> PICKED_UP
   */
  async verifyPickupOtp(orderId: string, otp: string, actor: AuthenticatedActor) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id: orderId }, { orderId }] },
      include: { order: true },
    });

    if (!job) {
      throw new NotFoundException('Delivery job not found.');
    }

    if (job.driverId !== actor.driverId) {
      throw new ForbiddenException('You are not the assigned delivery partner for this job.');
    }

    if (
      job.status !== DeliveryJobStatus.ARRIVED ||
      job.order.status !== OrderStatus.ARRIVED_AT_RESTAURANT
    ) {
      throw new BadRequestException(
        `Cannot verify pickup. Order status is "${job.order.status}", expected "ARRIVED_AT_RESTAURANT".`,
      );
    }

    if (job.pickupOtpAttempts >= 5) {
      throw new BadRequestException(
        'Maximum pickup verification attempts (5) exceeded. Contact restaurant staff to re-issue code.',
      );
    }

    if (job.pickupOtpExpiresAt && new Date() > job.pickupOtpExpiresAt) {
      throw new BadRequestException('Pickup verification code has expired.');
    }

    const submittedHash = hashOtp(otp);
    if (job.pickupOtpHash && job.pickupOtpHash !== submittedHash) {
      await this.prisma.deliveryJob.update({
        where: { id: job.id },
        data: { pickupOtpAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid pickup verification code.');
    }

    return this.transition(job.orderId, OrderStatus.PICKED_UP, actor);
  }

  /**
   * Rider Scans Signed QR Token to Verify Pickup
   */
  async verifyPickupQr(orderId: string, qrToken: string, actor: AuthenticatedActor) {
    const decoded = verifyQrToken(qrToken);
    if (!decoded) {
      throw new BadRequestException('Invalid or expired QR verification token.');
    }

    const job = await this.prisma.deliveryJob.findFirst({
      where: { id: decoded.deliveryJobId },
      include: { order: true },
    });

    if (!job || job.orderId !== decoded.orderId) {
      throw new NotFoundException('Delivery job matching QR token not found.');
    }

    if (job.driverId !== actor.driverId) {
      throw new ForbiddenException('QR code does not match your assigned delivery partner ID.');
    }

    if (
      job.status !== DeliveryJobStatus.ARRIVED ||
      job.order.status !== OrderStatus.ARRIVED_AT_RESTAURANT
    ) {
      throw new BadRequestException(
        `Cannot verify pickup. Order status is "${job.order.status}", expected "ARRIVED_AT_RESTAURANT".`,
      );
    }

    return this.transition(job.orderId, OrderStatus.PICKED_UP, actor);
  }

  /**
   * Rider Signals Arrival at Customer Delivery Location
   */
  async riderArrivedAtCustomer(jobOrOrderId: string, actor: AuthenticatedActor) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { OR: [{ id: jobOrOrderId }, { orderId: jobOrOrderId }] },
      include: {
        order: {
          include: {
            customer: { include: { user: true } },
            restaurant: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Delivery job not found.');
    }

    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
    if (!isAdmin && job.driverId !== actor.driverId) {
      throw new ForbiddenException('You are not the assigned delivery partner for this job.');
    }

    if (job.order.status === OrderStatus.DELIVERED) {
      return {
        message: 'Order has already been delivered.',
        orderId: job.orderId,
        status: OrderStatus.DELIVERED,
      };
    }

    if (job.order.status === OrderStatus.CANCELLED || job.order.status === OrderStatus.REJECTED) {
      throw new BadRequestException(`Cannot signal arrival. Order is ${job.order.status}.`);
    }

    if (
      job.order.status !== OrderStatus.OUT_FOR_DELIVERY &&
      job.order.status !== OrderStatus.PICKED_UP
    ) {
      throw new BadRequestException(
        `Cannot signal arrival. Order status is "${job.order.status}", expected "OUT_FOR_DELIVERY".`,
      );
    }

    const now = new Date();

    await this.prisma.deliveryJob.update({
      where: { id: job.id },
      data: {
        arrivedAt: now,
      },
    });

    await this.prisma.orderTimeline.create({
      data: {
        orderId: job.orderId,
        status: job.order.status,
        message: 'Delivery partner has arrived at your delivery address.',
      },
    });

    if (this.gateway) {
      this.gateway.emitToOrder(job.orderId, ORDER_EVENTS.RIDER_ARRIVED, {
        orderId: job.orderId,
        orderNumber: job.order.orderNumber,
        driverId: job.driverId,
        arrivedAt: now.toISOString(),
        message: 'Your delivery partner has arrived at your address.',
      });

      this.gateway.emitToOrder(job.orderId, ORDER_EVENTS.STATUS_UPDATED, {
        orderId: job.orderId,
        orderNumber: job.order.orderNumber,
        status: job.order.status,
        message: 'Delivery partner has arrived at your delivery address.',
      });
    }

    return {
      message: 'Arrival recorded. Customer notified with delivery confirmation code.',
      orderId: job.orderId,
      arrivedAt: now,
    };
  }

  /**
   * Authenticated Delivery Completion â€” No OTP Required
   * Validates: authenticated rider + assigned order + correct state.
   * Transitions order OUT_FOR_DELIVERY â†’ DELIVERED.
   */
  async completeDelivery(orderIdOrJobId: string, actor: AuthenticatedActor) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrJobId }, { deliveryJob: { id: orderIdOrJobId } }],
      },
      include: {
        restaurant: true,
        customer: { include: { user: true } },
        deliveryJob: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    // Idempotent completion check
    if (order.status === OrderStatus.DELIVERED) {
      return {
        message: 'Order is already delivered.',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: OrderStatus.DELIVERED,
      };
    }

    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
    const isAssignedDriver =
      actor.driverId &&
      (order.deliveryJob?.driverId === actor.driverId ||
        order.assignedRestaurantDriverId === actor.driverId);

    // Only assigned rider or admin can complete delivery â€” customer cannot self-complete
    if (!isAdmin && !isAssignedDriver) {
      throw new ForbiddenException('You are not authorized to complete delivery for this order.');
    }

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException(
        `Cannot complete delivery. Order status is "${order.status}", expected "OUT_FOR_DELIVERY".`,
      );
    }

    const now = new Date();

    const updatedOrderRecord = await this.prisma.$transaction(async (tx) => {
      // Re-check status inside transaction for concurrency protection
      const liveOrder = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });

      if (liveOrder?.status === OrderStatus.DELIVERED) {
        return order;
      }

      if (liveOrder?.status !== OrderStatus.OUT_FOR_DELIVERY) {
        throw new ConflictException(
          `Order status changed to "${liveOrder?.status}" during processing.`,
        );
      }

      // Update DeliveryJob if FoodHub rider delivery
      let updatedJob: any = null;
      if (order.deliveryJob) {
        updatedJob = await tx.deliveryJob.update({
          where: { id: order.deliveryJob.id },
          data: {
            status: DeliveryJobStatus.DELIVERED,
            deliveredAt: now,
          },
          select: { id: true, status: true, driverId: true, riderPayout: true, deliveryFee: true },
        });

        // Idempotent Driver Wallet Credit for assigned FoodHub rider
        if (updatedJob.driverId) {
          const driver = await tx.driver.findUnique({
            where: { id: updatedJob.driverId },
            select: { userId: true },
          });

          if (driver?.userId) {
            const payoutAmount = Number(
              updatedJob.riderPayout ||
                Math.max(30, Math.round(Number(updatedJob.deliveryFee || 40) * 0.8)),
            );

            let driverWallet = await tx.wallet.findUnique({
              where: { userId: driver.userId },
            });

            if (!driverWallet) {
              driverWallet = await tx.wallet.create({
                data: { userId: driver.userId, balance: 0 },
              });
            }

            const existingTx = await tx.walletTransaction.findFirst({
              where: {
                walletId: driverWallet.id,
                referenceId: order.id,
              },
            });

            if (!existingTx && payoutAmount > 0) {
              await tx.wallet.update({
                where: { id: driverWallet.id },
                data: { balance: { increment: payoutAmount } },
              });

              await tx.walletTransaction.create({
                data: {
                  walletId: driverWallet.id,
                  type: 'CREDIT',
                  amount: payoutAmount,
                  description: `Internal settlement ledger credit for delivering Order #${order.orderNumber}`,
                  referenceId: order.id,
                },
              });
            }
          }
        }
      }

      // If restaurant self-delivery staff, set back to AVAILABLE
      if (order.assignedRestaurantDriverId) {
        await tx.restaurantDeliveryStaff.update({
          where: { id: order.assignedRestaurantDriverId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Transition to DELIVERED
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DELIVERED,
          paymentStatus: 'COMPLETED' as any,
          version: { increment: 1 },
        },
        include: {
          restaurant: true,
          deliveryJob: true,
          orderItems: { include: { foodItem: true } },
          customer: { include: { user: { include: { profile: true } } } },
        },
      });

      const validActorUserId = this.isValidUuid(actor.userId) ? actor.userId : null;
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.OUT_FOR_DELIVERY,
          toStatus: OrderStatus.DELIVERED,
          changedBy: validActorUserId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: OrderStatus.DELIVERED,
          message: 'Order delivered successfully to customer.',
        },
      });

      await this.generateSettlements(tx, updated);

      return updated;
    });

    this.emitRealtimeEvents(
      updatedOrderRecord,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    );

    return {
      message: 'Order delivered successfully.',
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: OrderStatus.DELIVERED,
      deliveredAt: now,
    };
  }

  /**
   * Legacy alias â€” kept for backward compatibility, delegates to completeDelivery
   */
  async completeDeliveryWithOtp(orderIdOrJobId: string, _otp: string, actor: AuthenticatedActor) {
    return this.completeDelivery(orderIdOrJobId, actor);
  }

  /**
   * Rider Submits Delivery OTP â€” now OTP-free, delegates to completeDelivery
   */
  async verifyDeliveryOtp(orderId: string, _otp: string, actor: AuthenticatedActor) {
    return this.completeDelivery(orderId, actor);
  }

  /**
   * Authoritative Order State Transition Guard
   */
  async transition(
    orderId: string,
    targetStatus: OrderStatus,
    actor: AuthenticatedActor,
    extraData?: { reason?: string; cancellationReason?: string; deliveryJobPayload?: any },
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
      const now = new Date();

      if (targetStatus === OrderStatus.PREPARING) {
        const restLat = Number(order.restaurant.latitude || 0);
        const restLng = Number(order.restaurant.longitude || 74.5221);
        const delAddr = order.deliveryAddress as any;
        const custLat = Number(delAddr?.latitude || 0);
        const custLng = Number(delAddr?.longitude || 74.5228);

        const distanceKm = delAddr?.distanceKm || delAddr?.distanceKm || 0;

        const rawPickupOtp = generate4DigitOtp();
        const pickupOtpHash = hashOtp(rawPickupOtp);

        const pickupAddress = {
          restaurantName: order.restaurant.name,
          addressLine: order.restaurant.addressLine,
          latitude: restLat,
          longitude: restLng,
          phone: order.restaurant.phone,
          rawPickupOtp,
        };

        const dropAddress = {
          street: delAddr?.street || delAddr?.addressLine1 || 'Delivery Address',
          addressLine2: delAddr?.addressLine2 || '',
          city: delAddr?.city || '',
          state: delAddr?.state || 'Jammu & Kashmir',
          postalCode: delAddr?.postalCode || '193502',
          latitude: custLat,
          longitude: custLng,
          contactName: order.deliveryAddress ? delAddr?.name || 'Customer' : 'Customer',
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
            pickupOtpHash,
            pickupOtpExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
          update: {
            status: DeliveryJobStatus.AVAILABLE,
            pickupAddressJson: pickupAddress,
            pickupOtpHash,
            pickupOtpExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
          select: { id: true, status: true },
        });
      } else if (targetStatus === OrderStatus.DRIVER_ASSIGNED) {
        if (!actor.driverId) {
          throw new ForbiddenException(
            'Only registered delivery partners can accept delivery jobs.',
          );
        }

        if (extraData?.deliveryJobPayload) {
          updatedJob = await tx.deliveryJob.upsert({
            where: { orderId: order.id },
            create: extraData.deliveryJobPayload.create,
            update: extraData.deliveryJobPayload.update
          });
        } else {
          const existingJob = await tx.deliveryJob.findUnique({
            where: { orderId: order.id },
          });

          if (!existingJob) {
            throw new BadRequestException('No active delivery job exists for this order.');
          }

          if (existingJob.status !== DeliveryJobStatus.AVAILABLE || existingJob.driverId) {
            throw new ConflictException(
              'This delivery job has already been claimed by another delivery partner.',
            );
          }

          updatedJob = await tx.deliveryJob.update({
            where: { id: existingJob.id },
            data: {
              driverId: actor.driverId,
              status: DeliveryJobStatus.ASSIGNED,
              acceptedAt: now,
            },
            select: { id: true, status: true },
          });
        }

} else if (targetStatus === OrderStatus.ARRIVED_AT_RESTAURANT) {
        if (order.deliveryJob) {
          updatedJob = await tx.deliveryJob.update({
            where: { id: order.deliveryJob.id },
            data: {
              status: DeliveryJobStatus.ARRIVED,
              arrivedAt: now,
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
              pickedAt: now,
              pickupVerifiedAt: now,
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
              deliveredAt: now,
            },
            select: {
              id: true,
              status: true,
              driverId: true,
              riderPayout: true,
              deliveryFee: true,
            },
          });

          // Idempotent Driver Wallet Credit
          if (updatedJob.driverId) {
            const driver = await tx.driver.findUnique({
              where: { id: updatedJob.driverId },
              select: { userId: true },
            });

            if (driver?.userId) {
              const payoutAmount = Number(
                updatedJob.riderPayout ||
                  Math.max(30, Math.round(Number(updatedJob.deliveryFee || 40) * 0.8)),
              );

              // Check if wallet transaction for this order delivery already exists
              let driverWallet = await tx.wallet.findUnique({
                where: { userId: driver.userId },
              });

              if (!driverWallet) {
                driverWallet = await tx.wallet.create({
                  data: { userId: driver.userId, balance: 0 },
                });
              }

              const existingTx = await tx.walletTransaction.findFirst({
                where: {
                  walletId: driverWallet.id,
                  referenceId: order.id,
                },
              });

              if (!existingTx && payoutAmount > 0) {
                await tx.wallet.update({
                  where: { id: driverWallet.id },
                  data: { balance: { increment: payoutAmount } },
                });

                await tx.walletTransaction.create({
                  data: {
                    walletId: driverWallet.id,
                    type: 'CREDIT',
                    amount: payoutAmount,
                    description: `Internal settlement ledger credit for delivering Order #${order.orderNumber}`,
                    referenceId: order.id,
                  },
                });
              }
            }
          }
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

      const assignedDriverId =
        extraData?.deliveryJobPayload?.create?.driverId ||
        extraData?.deliveryJobPayload?.update?.driverId ||
        actor.driverId;

      const updatedOrderRecord = await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          version: { increment: 1 },
          ...(targetStatus === OrderStatus.DELIVERED ? { paymentStatus: 'COMPLETED' as any } : {}),
          ...(targetStatus === OrderStatus.DRIVER_ASSIGNED && assignedDriverId
            ? { assignedFoodHubDriverId: assignedDriverId }
            : {}),
        },
        include: {
          restaurant: true,
          deliveryJob: {
            select: {
              id: true,
              status: true,
              driverId: true,
              riderPayout: true,
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
          customer: { select: { id: true, userId: true } },
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

      if (targetStatus === OrderStatus.DELIVERED) {
        await this.generateSettlements(tx, updatedOrderRecord);
      }

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
    const isCustomer = order.customer?.userId === actor.userId || order.customerId === actor.userId;
    const isRestaurantOwner = actor.userId === order.restaurant?.ownerId;
    const isRestaurantStaff = actor.restaurantId === order.restaurantId;
    const isAssignedDriver = actor.driverId && order.deliveryJob?.driverId === actor.driverId;
    const isAdmin = actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';

    const isRestaurantActor = isRestaurantOwner || isRestaurantStaff || isAdmin;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      ACCEPTED: [OrderStatus.PREPARING, OrderStatus.DRIVER_ASSIGNED, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
      READY_FOR_PICKUP: [], // Removed from lifecycle â€“ kept in map to avoid exhaustiveness error
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
        throw new ForbiddenException(
          'Only the restaurant owner or staff can accept/reject this order.',
        );
      }
    }

    if (([OrderStatus.PREPARING, OrderStatus.PREPARING] as OrderStatus[]).includes(targetStatus)) {
      if (!isRestaurantActor && !isAdmin) {
        throw new ForbiddenException(
          'Only authorized restaurant staff or admins can update order prep status.',
        );
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
        throw new ForbiddenException(
          'Only the assigned delivery partner can update trip progress.',
        );
      }
    }
  }

  private emitRealtimeEvents(
    order: any,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    overrideDriverId?: string,
  ) {
    this.logger.log(
      `[STATE MACHINE EVENT] Order #${order.orderNumber} transitioned from ${fromStatus} to ${toStatus}`,
    );
    if (this.gateway) {
      const activeDriverId =
        overrideDriverId || order.deliveryJob?.driverId || order.assignedRestaurantDriverId;
      const sanitizedPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        fromStatus,
        toStatus,
        status: toStatus,
        version: order.version,
        restaurantId: order.restaurantId,
        customerId: order.customerId,
        driverId: activeDriverId,
        driverName: order.deliveryJob?.driver?.user?.profile
          ? `${order.deliveryJob.driver.user.profile.firstName || ''} ${order.deliveryJob.driver.user.profile.lastName || ''}`.trim()
          : undefined,
        totalAmount: order.totalAmount,
        timestamp: new Date().toISOString(),
      };

      // 1. Broad generic update to order room
      this.gateway.emitToOrder(order.id, ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);

      // 2. Direct notifications to user / restaurant / driver rooms
      const customerUserId = order.customer?.userId || order.customerId;
      if (customerUserId) {
        this.gateway.emitToUser(customerUserId, ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);
      }
      if (order.restaurantId) {
        this.gateway.emitToRestaurant(
          order.restaurantId,
          ORDER_EVENTS.STATUS_UPDATED,
          sanitizedPayload,
        );
      }
      if (customerUserId)
        this.gateway.emitToUser(customerUserId, ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);
      if (order.restaurantId)
        this.gateway.emitToRestaurant(
          order.restaurantId,
          ORDER_EVENTS.STATUS_UPDATED,
          sanitizedPayload,
        );
      if (activeDriverId)
        this.gateway.emitToDriver(activeDriverId, ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);
      this.gateway.emitToAdmin(ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);

      // 2. Broadcast to available drivers when order reaches DRIVER_ASSIGNED state (driver dispatch triggered at PREPARING)
      if (toStatus === OrderStatus.PREPARING && !activeDriverId) {
        this.gateway?.emitToAvailableDrivers?.(ORDER_EVENTS.JOB_AVAILABLE, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          jobId: order.deliveryJob?.id,
          restaurantName: order.restaurant?.name || 'Restaurant Partner',
          restaurantAddress: order.restaurant?.addressLine || 'Restaurant Location',
          deliveryFee: order.deliveryFee || 40,
          estimatedPayout: order.deliveryJob?.riderPayout || 35,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private getTimelineMessage(status: OrderStatus, reason?: string): string {
    switch (status) {
      case OrderStatus.ACCEPTED:
        return 'Restaurant accepted order and sent to kitchen.';
      case OrderStatus.REJECTED:
        return `Restaurant rejected order. Reason: ${reason || 'Not specified'}.`;
      case OrderStatus.PREPARING:
        return 'Chef started preparing items in kitchen queue.';
      case OrderStatus.PREPARING:
        return 'Order is packed and ready for delivery partner pickup.';
      case OrderStatus.DRIVER_ASSIGNED:
        return 'FoodHub delivery partner assigned to order.';
      case OrderStatus.ARRIVED_AT_RESTAURANT:
        return 'Delivery partner arrived at restaurant for pickup.';
      case OrderStatus.PICKED_UP:
        return 'Delivery partner verified pickup code and received order.';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Delivery partner started journey to customer location.';
      case OrderStatus.DELIVERED:
        return 'Order delivered successfully to customer.';
      case OrderStatus.CANCELLED:
        return `Order cancelled. Reason: ${reason || 'Not specified'}.`;
      default:
        return `Order status updated to ${status}.`;
    }
  }

  private async generateSettlements(tx: any, order: any) {
    const snap: any = order.pricingSnapshot || {};
    const now = new Date();

    // 1. Restaurant Settlement
    const foodSubtotal =
      snap.restaurantGross !== undefined
        ? Number(snap.restaurantGross)
        : Number(order.subtotal || 0);
    const commissionRate = snap.commissionRate !== undefined ? Number(snap.commissionRate) : 13.0;
    const commissionAmount =
      snap.commissionAmount !== undefined
        ? Number(snap.commissionAmount)
        : Math.round(((foodSubtotal * commissionRate) / 100) * 100) / 100;
    const commissionGstAmount =
      snap.commissionGstAmount !== undefined
        ? Number(snap.commissionGstAmount)
        : Math.round(commissionAmount * 0.18 * 100) / 100;
    const deductions = snap.packagingFee !== undefined ? Number(snap.packagingFee) : 0;
    const restaurantNet =
      snap.restaurantNet !== undefined
        ? Number(snap.restaurantNet)
        : Math.round((foodSubtotal - commissionAmount - commissionGstAmount + deductions) * 100) /
          100;

    await tx.restaurantSettlement.upsert({
      where: { orderId: order.id },
      create: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        periodStart: now,
        periodEnd: now,
        grossAmount: foodSubtotal,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        deductions: deductions,
        netPayable: restaurantNet,
        status: 'ELIGIBLE',
      },
      update: {},
    });

    // 2. Rider Settlement
    if (order.deliveryJob && order.deliveryJob.driverId) {
      const basePayout = snap.riderBasePayout !== undefined ? Number(snap.riderBasePayout) : 30;
      const distancePayout =
        snap.deliveryFeePerExtraKm !== undefined
          ? Number(snap.deliveryFeePerExtraKm) *
            Math.max(0, (snap.deliveryDistanceKm || 0) - (snap.deliveryFeeBaseKm || 3))
          : 0;
      const netPayout = Number(
        order.deliveryJob.riderPayout ||
          Math.max(30, Math.round(Number(order.deliveryJob.deliveryFee || 40) * 0.8)),
      );

      await tx.riderSettlement.upsert({
        where: { orderId: order.id },
        create: {
          driverId: order.deliveryJob.driverId,
          orderId: order.id,
          periodStart: now,
          periodEnd: now,
          basePayoutAmount: basePayout,
          distancePayout: distancePayout,
          netPayable: netPayout,
          status: 'ELIGIBLE',
        },
        update: {},
      });
    }
  }
}
