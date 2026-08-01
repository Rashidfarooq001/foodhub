import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { serializePrisma } from '../../common/utils/serializer.util';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ORDER_EVENTS } from './orders.events';
import { OrderStatus, Prisma } from '@prisma/client';

/** Generates a unique order number like FH-948210 */
function generateOrderNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `FH-${num}`;
}

/** Generates a 4-digit numeric delivery OTP */
function generateDeliveryOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma:      PrismaService,
    private readonly repo:        OrdersRepository,
    private readonly validation:  OrdersValidationService,
    private readonly gateway:     OrdersGateway,
  ) {}

  async createOrder(customerId: string, dto: CreateOrderDto) {
    // 1. Validate restaurant
    await this.validation.validateRestaurantOpen(dto.restaurantId);

    // 2. Validate items & inventory
    await this.validation.validateItemsAvailable(dto.items);

    // 3. Calculate subtotal
    let subtotal = 0;
    const itemsWithPrices: Array<{
      foodItemId:  string;
      quantity:    number;
      unitPrice:   number;
      totalPrice:  number;
      addonsJson:  Prisma.InputJsonValue | typeof Prisma.JsonNull;
    }> = [];

    for (const item of dto.items) {
      const food = await this.prisma.foodItem.findUniqueOrThrow({
        where: { id: item.foodItemId },
      });
      const addonTotal = item.addonsJson
        ? (item.addonsJson as Array<{ price: number }>).reduce(
            (sum, a) => sum + (a.price || 0), 0,
          )
        : 0;
      const unitPrice  = Number(food.price) + addonTotal;
      const totalPrice = unitPrice * item.quantity;
      subtotal        += totalPrice;
      itemsWithPrices.push({
        foodItemId: item.foodItemId,
        quantity:   item.quantity,
        unitPrice,
        totalPrice,
        addonsJson: item.addonsJson
          ? (item.addonsJson as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      });
    }

    // 4. Validate minimum order
    await this.validation.validateMinimumOrder(dto.restaurantId, subtotal);

    // 5. Apply coupon
    let discountAmount = 0;
    if (dto.couponCode) {
      discountAmount = await this.validation.validateAndApplyCoupon(
        dto.couponCode, customerId, subtotal,
      );
    }

    // 6. Platform fees
    const restaurantSetting = await this.prisma.restaurantSetting.findUnique({
      where: { restaurantId: dto.restaurantId },
    });
    const packagingFee = restaurantSetting ? Number(restaurantSetting.packagingFee) : 15;
    const deliveryFee  = 30;
    const taxRate      = 0.05;
    const taxableBase  = subtotal - discountAmount;
    const taxAmount    = Math.round(taxableBase * taxRate * 100) / 100;
    const totalAmount  = taxableBase + taxAmount + deliveryFee + packagingFee;

    // 7. Wallet deduction check
    if (dto.useWallet) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { user: true },
      });
      if (customer) {
        await this.validation.validateWalletBalance(customer.userId, totalAmount);
      }
    }

    // 8. Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber:        generateOrderNumber(),
          customerId,
          restaurantId:       dto.restaurantId,
          status:             OrderStatus.PENDING,
          subtotal,
          packagingFee,
          deliveryFee,
          taxAmount,
          discountAmount,
          totalAmount,
          paymentMethod:      dto.paymentMethod,
          deliveryAddress:    dto.deliveryAddress as Prisma.InputJsonValue,
          deliveryOtp:        generateDeliveryOtp(),
          specialInstruction: dto.specialInstruction,
        },
      });

      // Create order items via createMany (avoids nested create type issue)
      await tx.orderItem.createMany({
        data: itemsWithPrices.map((item) => ({
          orderId:    newOrder.id,
          foodItemId: item.foodItemId,
          quantity:   item.quantity,
          unitPrice:  item.unitPrice,
          totalPrice: item.totalPrice,
          addonsJson: item.addonsJson,
        })),
      });

      // Append initial timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status:  OrderStatus.PENDING,
          message: 'Order placed successfully',
        },
      });

      return newOrder;
    });

    // 9. Emit real-time event to restaurant
    this.gateway.emitToRestaurant(dto.restaurantId, ORDER_EVENTS.ORDER_CREATED, {
      orderId:     order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });

    return order;
  }

  async updateStatus(
    orderId:   string,
    dto:       UpdateOrderStatusDto,
    changedBy?: string,
  ) {
    const order = await this.repo.findById(orderId);

    this.validation.validateStatusTransition(order.status, dto.status);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: dto.status },
    });

    await this.repo.appendTimeline(orderId, dto.status, dto.message);
    await this.repo.appendStatusHistory(orderId, order.status, dto.status, changedBy);

    const eventMap: Partial<Record<OrderStatus, string>> = {
      ACCEPTED:         ORDER_EVENTS.ORDER_ACCEPTED,
      PREPARING:        ORDER_EVENTS.ORDER_PREPARING,
      READY_FOR_PICKUP: ORDER_EVENTS.ORDER_READY,
      DRIVER_ASSIGNED:  ORDER_EVENTS.DRIVER_ASSIGNED,
      OUT_FOR_DELIVERY: ORDER_EVENTS.ORDER_PICKED_UP,
      DELIVERED:        ORDER_EVENTS.ORDER_DELIVERED,
      CANCELLED:        ORDER_EVENTS.ORDER_CANCELLED,
    };

    const event = eventMap[dto.status];
    if (event) {
      this.gateway.emitToOrder(orderId, event as any, {
        orderId,
        status:  dto.status,
        message: dto.message,
      });
    }

    return updated;
  }

  async cancelOrder(
    orderId:     string,
    dto:         CancelOrderDto,
    cancelledBy: string,
  ) {
    const order = await this.repo.findById(orderId);

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new ForbiddenException(
        `Order cannot be cancelled once ${order.status}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data:  { status: OrderStatus.CANCELLED },
      }),
      this.prisma.orderCancellation.create({
        data: { orderId, reason: dto.reason, cancelledBy },
      }),
      this.prisma.orderTimeline.create({
        data: { orderId, status: OrderStatus.CANCELLED, message: dto.reason },
      }),
    ]);

    this.gateway.emitToOrder(orderId, ORDER_EVENTS.ORDER_CANCELLED, {
      orderId,
      reason: dto.reason,
    });

    return { message: 'Order cancelled successfully' };
  }

  async getOrderWithTimeline(orderId: string) {
    const res = await this.repo.findById(orderId);
    return serializePrisma(res);
  }

  async getCustomerOrders(customerId: string, page: number, limit: number) {
    const res = await this.repo.findByCustomer(customerId, page, limit);
    return serializePrisma(res);
  }

  async getRestaurantOrders(
    restaurantId: string,
    status?:      OrderStatus,
    page?:        number,
    limit?:       number,
  ) {
    const res = await this.repo.findByRestaurant(restaurantId, status, page, limit);
    return serializePrisma(res);
  }

  async getAllOrders(status?: any, page = 1, limit = 20) {
    const res = await this.repo.findAll(status, page, limit);
    return serializePrisma(res);
  }

  async getDriverOrders(driverId: string, page: number, limit: number) {
    const res = await this.repo.findByDriver(driverId, page, limit);
    return serializePrisma(res);
  }

  async generateInvoice(orderId: string) {
    const order = await this.repo.findById(orderId);

    return {
      invoiceNumber:   `INV-${order.orderNumber}`,
      orderId:         order.id,
      orderNumber:     order.orderNumber,
      placedAt:        order.createdAt,
      items:           order.orderItems.map((i) => ({
        name:       (i as any).foodItem?.name ?? 'Item',
        quantity:   i.quantity,
        unitPrice:  Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
      subtotal:        Number(order.subtotal),
      discountAmount:  Number(order.discountAmount),
      packagingFee:    Number(order.packagingFee),
      deliveryFee:     Number(order.deliveryFee),
      taxAmount:       Number(order.taxAmount),
      grandTotal:      Number(order.totalAmount),
      paymentStatus:   order.paymentStatus,
      paymentMethod:   order.paymentMethod,
      deliveryAddress: order.deliveryAddress,
    };
  }

  async repeatOrder(orderId: string) {
    const order = await this.repo.findById(orderId);

    return {
      restaurantId: order.restaurantId,
      items: order.orderItems.map((i) => ({
        foodItemId: i.foodItemId,
        quantity:   i.quantity,
        addonsJson: i.addonsJson ?? undefined,
      })),
    };
  }

  async assignSelfDeliveryRider(orderId: string, riderId: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { restaurant: true },
    });

    const rider = await this.prisma.restaurantDeliveryStaff.findUniqueOrThrow({
      where: { id: riderId },
    });

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          assignedRestaurantDriverId: riderId,
          assignedFoodHubDriverId: null,
          status: OrderStatus.DRIVER_ASSIGNED,
        },
      }),
      this.prisma.restaurantDeliveryStaff.update({
        where: { id: riderId },
        data: { status: 'BUSY' },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: OrderStatus.DRIVER_ASSIGNED,
          message: `Assigned self delivery rider ${rider.firstName} ${rider.lastName || ''}`.trim(),
        },
      }),
    ]);

    this.gateway.emitToOrder(orderId, ORDER_EVENTS.DRIVER_ASSIGNED, {
      orderId,
      riderName: `${rider.firstName} ${rider.lastName || ''}`.trim(),
      phone: rider.phone,
      vehicle: rider.vehicleNumber,
    });

    return { message: 'Self delivery rider assigned successfully', rider };
  }

  async getSelfRiderOrders(riderId: string) {
    return this.prisma.order.findMany({
      where: { assignedRestaurantDriverId: riderId },
      include: {
        customer: { include: { user: { include: { profile: true } } } },
        restaurant: true,
        orderItems: { include: { foodItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSelfDeliveryStatus(orderId: string, status: string, otp?: string) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });

    if (status === 'DELIVERED' && otp && order.deliveryOtp !== otp) {
      throw new BadRequestException('Invalid Delivery OTP');
    }

    const nextStatus = status as OrderStatus;

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: nextStatus,
          message: `Self delivery status updated to ${nextStatus}`,
        },
      }),
      ...(status === 'DELIVERED' && order.assignedRestaurantDriverId
        ? [
            this.prisma.restaurantDeliveryStaff.update({
              where: { id: order.assignedRestaurantDriverId },
              data: { status: 'AVAILABLE' },
            }),
          ]
        : []),
    ]);

    this.gateway.emitToOrder(orderId, ORDER_EVENTS.STATUS_UPDATED, {
      orderId,
      status: nextStatus,
    });

    return { message: `Order status updated to ${nextStatus}` };
  }
}
