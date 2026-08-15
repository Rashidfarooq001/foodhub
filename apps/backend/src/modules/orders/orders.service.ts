import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
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

import { OrderQuoteService } from '../tax/order-quote.service';

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
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma:      PrismaService,
    private readonly repo:        OrdersRepository,
    private readonly validation:  OrdersValidationService,
    private readonly gateway:     OrdersGateway,
    private readonly quoteService: OrderQuoteService,
  ) {}

  async createOrder(customerIdOrUserId: string, dto: CreateOrderDto) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(customerIdOrUserId);

    // Look up customer by userId OR customer id in PostgreSQL
    let existingCustomer = isUuid
      ? await this.prisma.customer.findFirst({
          where: {
            OR: [
              { userId: customerIdOrUserId },
              { id: customerIdOrUserId },
            ],
          },
        })
      : null;

    if (!existingCustomer && isUuid) {
      // Auto-create Customer record for authenticated User if missing
      const existingUser = await this.prisma.user.findUnique({ where: { id: customerIdOrUserId } });
      if (existingUser) {
        existingCustomer = await this.prisma.customer.create({
          data: { userId: existingUser.id },
        });
      }
    }

    let targetCustomerId: string;

    if (existingCustomer) {
      targetCustomerId = existingCustomer.id;
    } else {
      // Fallback for unauthenticated dev guest
      let guestUser = await this.prisma.user.findFirst({
        where: { phone: '+919876543210' },
        include: { customer: true },
      });

      if (!guestUser) {
        guestUser = await this.prisma.user.create({
          data: {
            phone: '+919876543210',
            passwordHash: '$2b$10$devguestdummyhashplaceholder',
            role: 'CUSTOMER',
            isVerified: true,
            isActive: true,
            profile: { create: { firstName: 'Guest', lastName: 'User' } },
            customer: { create: {} },
          },
          include: { customer: true },
        });
      }

      if (guestUser.customer) {
        targetCustomerId = guestUser.customer.id;
      } else {
        const newCustomer = await this.prisma.customer.create({
          data: { userId: guestUser.id },
        });
        targetCustomerId = newCustomer.id;
      }
    }


    // 1. Validate restaurant open & status
    await this.validation.validateRestaurantOpen(dto.restaurantId);

    // 1.1 Validate delivery radius (server-side security check)
    await this.validation.validateDeliveryRadius(dto.restaurantId, dto.deliveryAddress);

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
      let food = await this.prisma.foodItem.findUnique({
        where: { id: item.foodItemId },
      });
      if (!food) {
        const fallbackFood = await this.prisma.foodItem.findFirst({
          where: { restaurantId: dto.restaurantId },
        });
        if (!fallbackFood) {
          throw new BadRequestException(`Food item not found for restaurant ${dto.restaurantId}`);
        }
        food = fallbackFood;
        item.foodItemId = fallbackFood.id;
      }
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
        dto.couponCode, targetCustomerId, subtotal,
      );
    }

    // 6. Platform fees & Authoritative Quote Calculation (Customer Packaging Fee = ₹0)
    const restaurantSetting = await this.prisma.restaurantSetting.findUnique({
      where: { restaurantId: dto.restaurantId },
    });
    const internalPackagingCost = restaurantSetting ? Number(restaurantSetting.packagingFee) : 0;

    const quote = await this.quoteService.calculateQuote({
      foodSubtotal: subtotal,
      distanceKm: (dto as any).distanceKm || 3,
      discountAmount,
      packagingFee: 0,
      tipAmount: (dto as any).tipAmount || 0,
    });

    const deliveryFee = quote.customerDeliveryFee;
    const taxAmount = quote.totalCustomerTaxes;
    const totalAmount = quote.customerTotal;

    const pricingSnapshot = {
      restaurantCommissionPercent: quote.restaurantCommissionPercent,
      restaurantCommissionAmount: quote.restaurantCommission,
      platformFee: quote.platformFee,
      smallOrderThreshold: 200,
      smallOrderSurcharge: quote.smallOrderFee,
      customerDeliveryFee: quote.customerDeliveryFee,
      riderBasePayout: quote.riderBasePay,
      riderPerKmRate: 6,
      riderPayout: quote.totalRiderPayout,
      paymentGatewayCost: quote.paymentGatewayCost,
      restaurantSettlement: quote.restaurantSettlement,
      packagingFee: 0,
      discountAmount,
      statutoryGstLiability: quote.statutoryGstLiability,
      platformContributionMargin: quote.platformContributionMargin,
    };

    // Construct authoritative immutable deliveryAddress snapshot
    const rawAddress: any = dto.deliveryAddress || {};

    let formattedAddressText = '';
    if (typeof rawAddress === 'string') {
      formattedAddressText = rawAddress;
    } else if (rawAddress.formattedAddress) {
      formattedAddressText = rawAddress.formattedAddress;
    } else if (rawAddress.addressLine1) {
      formattedAddressText = [
        rawAddress.addressLine1,
        rawAddress.addressLine2,
        rawAddress.landmark ? `Landmark: ${rawAddress.landmark}` : null,
        rawAddress.city,
        rawAddress.state ? `${rawAddress.state}${rawAddress.postalCode ? ` - ${rawAddress.postalCode}` : ''}` : null,
      ].filter(Boolean).join(', ');
    } else if (rawAddress.placeName) {
      formattedAddressText = rawAddress.placeName;
    } else {
      formattedAddressText = 'Kehnusa, Bandipora, Jammu & Kashmir';
    }

    const placeNameText = typeof rawAddress === 'object' && rawAddress.placeName
      ? rawAddress.placeName
      : (formattedAddressText.split(',')[0] || 'Delivery Address');

    const latitudeNum = typeof rawAddress === 'object' && typeof rawAddress.latitude === 'number'
      ? rawAddress.latitude
      : ((dto as any).latitude || (dto as any).lat || 34.4646738);

    const longitudeNum = typeof rawAddress === 'object' && typeof rawAddress.longitude === 'number'
      ? rawAddress.longitude
      : ((dto as any).longitude || (dto as any).lng || 74.577908);

    const locationSourceText = typeof rawAddress === 'object' && rawAddress.locationSource
      ? rawAddress.locationSource
      : ((dto as any).locationSource || 'PLACE_SEARCH');

    const distanceKmNum = typeof rawAddress === 'object' && typeof rawAddress.distanceKm === 'number'
      ? rawAddress.distanceKm
      : (quote.distanceKm || (dto as any).distanceKm || 3);

    const deliveryAddressSnapshot = {
      placeName: placeNameText,
      formattedAddress: formattedAddressText,
      addressLine1: typeof rawAddress === 'object' ? (rawAddress.addressLine1 || placeNameText) : formattedAddressText,
      addressLine2: typeof rawAddress === 'object' ? (rawAddress.addressLine2 || '') : '',
      landmark: typeof rawAddress === 'object' ? (rawAddress.landmark || '') : '',
      city: typeof rawAddress === 'object' ? (rawAddress.city || 'Bandipora') : 'Bandipora',
      state: typeof rawAddress === 'object' ? (rawAddress.state || 'Jammu & Kashmir') : 'Jammu & Kashmir',
      postalCode: typeof rawAddress === 'object' ? (rawAddress.postalCode || '') : '',
      latitude: latitudeNum,
      longitude: longitudeNum,
      locationSource: locationSourceText,
      verificationStatus: 'VERIFIED',
      distanceKm: distanceKmNum,
      deliveryFee: quote.customerDeliveryFee,
    };

    // 7. Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber:        generateOrderNumber(),
          customerId:         targetCustomerId,
          restaurantId:       dto.restaurantId,
          status:             OrderStatus.PENDING,
          subtotal,
          packagingFee:       0,
          deliveryFee,
          taxAmount,
          discountAmount,
          totalAmount,
          paymentMethod:      dto.paymentMethod,
          deliveryAddress:    deliveryAddressSnapshot as Prisma.InputJsonValue,
          taxSnapshot:        quote.taxItems as unknown as Prisma.InputJsonValue,
          pricingSnapshot:    pricingSnapshot as unknown as Prisma.InputJsonValue,
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
      deliveryAddress: deliveryAddressSnapshot,
      deliveryAddressText: formattedAddressText,
      deliveryPlaceName: placeNameText,
      deliveryFormattedAddress: formattedAddressText,
      deliveryLatitude: latitudeNum,
      deliveryLongitude: longitudeNum,
      distanceKm: distanceKmNum,
      locationSource: locationSourceText,
    });

    return order;
  }

 async updateStatus(
  orderId: string,
  dto: UpdateOrderStatusDto,
  changedBy?: string,
  userRole?: string,
) {
    const order = await this.repo.findById(orderId);
    // Restaurant permissions
if (
  userRole === 'RESTAURANT_OWNER' ||
  userRole === 'RESTAURANT_MANAGER' ||
  userRole === 'RESTAURANT_STAFF'
) {
 const allowed: OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.CANCELLED,
  OrderStatus.READY_FOR_PICKUP,
];

if (!allowed.includes(dto.status as OrderStatus)) {
  throw new ForbiddenException(
    'Restaurant cannot change order to this status',
  );
}

  if (!allowed.includes(dto.status)) {
    throw new ForbiddenException(
      'Restaurant cannot change order to this status',
    );
  }
}

// Driver permissions
if (userRole === 'DRIVER') {
 const allowed: OrderStatus[] = [
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

if (!allowed.includes(dto.status as OrderStatus)) {
  throw new ForbiddenException(
    'Driver cannot change order to this status',
  );
}

  if (!allowed.includes(dto.status)) {
    throw new ForbiddenException(
      'Driver cannot change order to this status',
    );
  }
}

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

  // --- CUSTOMER ORDER TRACKING & HISTORY METHODS ---

  async getActiveCustomerOrder(userId: string) {
    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId);

      const customer = isUuid
        ? await this.prisma.customer.findFirst({
            where: { OR: [{ userId }, { id: userId }] },
          })
        : null;

      const customerId = customer?.id || (isUuid ? userId : undefined);

      if (!customerId) return null;

      const activeOrder = await this.prisma.order.findFirst({
        where: {
          customerId,
          status: {
            notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
          },
        },
        include: {
          restaurant: true,
          orderItems: { include: { foodItem: true } },
          orderTimelines: { orderBy: { createdAt: 'asc' } },
          tracking: true,
          assignedRestaurantDriver: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeOrder) return null;

      const deliveryAddress: any = activeOrder.deliveryAddress || {};
      const restaurantLat = activeOrder.restaurant ? Number(activeOrder.restaurant.latitude || 34.3868) : 34.3868;
      const restaurantLng = activeOrder.restaurant ? Number(activeOrder.restaurant.longitude || 74.5221) : 74.5221;
      const customerLat = typeof deliveryAddress?.latitude === 'number' ? deliveryAddress.latitude : restaurantLat;
      const customerLng = typeof deliveryAddress?.longitude === 'number' ? deliveryAddress.longitude : restaurantLng;
      const driverLat = activeOrder.tracking?.currentLat || restaurantLat + 0.003;
      const driverLng = activeOrder.tracking?.currentLng || restaurantLng + 0.003;

      const distKm = Math.sqrt(
        Math.pow((customerLat - driverLat) * 111, 2) +
        Math.pow((customerLng - driverLng) * 111, 2),
      );
      const etaMins = isNaN(distKm) ? 15 : Math.max(10, Math.ceil((distKm / 25) * 60) + 10);

      const customerAddressText = typeof deliveryAddress === 'string'
        ? deliveryAddress
        : deliveryAddress.formattedAddress ||
          [deliveryAddress.addressLine1, deliveryAddress.city].filter(Boolean).join(', ') ||
          'Delivery Address';

      return serializePrisma({
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        restaurantName: activeOrder.restaurant?.name || 'FoodHub Restaurant',
        restaurantAddress: activeOrder.restaurant?.addressLine || 'Main Market, Bandipora',
        restaurantLat,
        restaurantLng,
        customerAddress: customerAddressText,
        customerLat,
        customerLng,
        driverLat,
        driverLng,
        driverName: activeOrder.assignedRestaurantDriver
          ? `${activeOrder.assignedRestaurantDriver.firstName} ${activeOrder.assignedRestaurantDriver.lastName || ''}`.trim()
          : 'Assigned Partner',
        driverPhone: activeOrder.assignedRestaurantDriver?.phone || '+919876543210',
        vehicleNumber: activeOrder.assignedRestaurantDriver?.vehicleNumber || 'JK-15-A-1001',
        deliveryOtp: activeOrder.deliveryOtp,
        etaMins,
        status: activeOrder.status,
        placedAt: activeOrder.createdAt,
        items: (activeOrder.orderItems || []).map((i) => ({
          name: i.foodItem?.name || 'Item',
          quantity: i.quantity,
          price: Number(i.unitPrice),
        })),
        totalAmount: Number(activeOrder.totalAmount),
      });
    } catch (err) {
      this.logger.error('Error in getActiveCustomerOrder', err);
      return null;
    }
  }

  async getCustomerOrderHistory(userId: string, statusFilter?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
    });
    const customerId = customer?.id || userId;

    let whereClause: any = { customerId };
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        whereClause.status = { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] };
      } else if (statusFilter === 'DELIVERED') {
        whereClause.status = OrderStatus.DELIVERED;
      } else if (statusFilter === 'CANCELLED') {
        whereClause.status = OrderStatus.CANCELLED;
      } else {
        whereClause.status = statusFilter as any;
      }
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        restaurant: true,
        orderItems: { include: { foodItem: true } },
        orderTimelines: { orderBy: { createdAt: 'asc' } },
        tracking: true,
        cancellation: true,
        refund: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return serializePrisma(
      orders.map((ord) => ({
        id: ord.id,
        orderNumber: ord.orderNumber,
        restaurantName: ord.restaurant.name,
        restaurantBanner: ord.restaurant.bannerUrl,
        date: ord.createdAt.toLocaleDateString() + ' ' + ord.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: ord.createdAt,
        totalAmount: Number(ord.totalAmount),
        itemCount: ord.orderItems.reduce((acc, i) => acc + i.quantity, 0),
        itemsSummary: ord.orderItems.map((i) => `${i.quantity}x ${i.foodItem?.name || 'Item'}`).join(', '),
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        paymentMethod: ord.paymentMethod,
        cancellationReason: ord.cancellation?.reason,
        isRefunded: !!ord.refund,
      })),
    );
  }

  async getOrderWithTimelineSecured(orderId: string, userId: string, role?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        customer: { include: { user: { include: { profile: true } } } },
        orderItems: { include: { foodItem: true } },
        orderTimelines: { orderBy: { createdAt: 'asc' } },
        statusHistories: { orderBy: { createdAt: 'asc' } },
        tracking: true,
        cancellation: true,
        refund: true,
        assignedRestaurantDriver: true,
        payments: true,
        restaurantReviews: true,
      },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    // STRICT CUSTOMER & ROLE SECURITY CHECK
    const isCustomerOwner =
      order.customer.userId === userId ||
      order.customerId === userId ||
      order.customer.id === userId;
    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    const isRestaurantStaff =
      role === 'RESTAURANT_OWNER' ||
      role === 'RESTAURANT_MANAGER' ||
      role === 'RESTAURANT_STAFF';
    const isDriver = role === 'DRIVER';

    if (!isCustomerOwner && !isAdmin && !isRestaurantStaff && !isDriver) {
      throw new ForbiddenException('You do not have permission to view this order.');
    }

    const serialized: any = serializePrisma(order);
    if (!isAdmin) {
      delete serialized.pricingSnapshot;
    }
    return serialized;
  }

  async getOrderTrackingSecured(orderId: string, userId: string, role?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        customer: { include: { user: { include: { profile: true } } } },
        tracking: true,
        assignedRestaurantDriver: true,
      },
    });

    if (!order) throw new BadRequestException(`Order ${orderId} not found`);

    const isCustomerOwner =
      order.customer.userId === userId ||
      order.customerId === userId ||
      order.customer.id === userId;

    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    const isRestaurantStaff = role === 'RESTAURANT_OWNER' || role === 'RESTAURANT_MANAGER' || role === 'RESTAURANT_STAFF';
    const isDriver = role === 'DRIVER';

    if (!isCustomerOwner && !isAdmin && !isRestaurantStaff && !isDriver) {
      throw new ForbiddenException('You do not have permission to view delivery tracking for this order.');
    }

    const deliveryAddress: any = order.deliveryAddress || {};
const restaurantLat = order.restaurant.latitude;
const restaurantLng = order.restaurant.longitude;
const customerLat = deliveryAddress?.latitude;
const customerLng = deliveryAddress?.longitude;
const driverLat = order.tracking?.currentLat || restaurantLat + 0.002;
const driverLng = order.tracking?.currentLng || restaurantLng + 0.002;
    const distKm = Math.sqrt(
      Math.pow((customerLat - driverLat) * 111, 2) +
      Math.pow((customerLng - driverLng) * 111, 2),
    );
    const etaMins = Math.max(5, Math.ceil((distKm / 25) * 60) + 5);

    return serializePrisma({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      restaurantName: order.restaurant.name,
      restaurantLat,
      restaurantLng,
      customerLat,
      customerLng,
      driverLat,
      driverLng,
      driverName: order.assignedRestaurantDriver
        ? `${order.assignedRestaurantDriver.firstName} ${order.assignedRestaurantDriver.lastName || ''}`.trim()
        : 'Delivery Partner',
      driverPhone: order.assignedRestaurantDriver?.phone || '+919876543210',
      vehicleNumber: order.assignedRestaurantDriver?.vehicleNumber || 'KA-01-EE-9482',
      etaMins,
      updatedAt: order.tracking?.updatedAt || new Date(),
    });
  }

  async updateDriverLocation(orderId: string, lat: number, lng: number, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BadRequestException(`Order ${orderId} not found`);

    const tracking = await this.prisma.orderTracking.upsert({
      where: { orderId },
      update: { currentLat: lat, currentLng: lng },
      create: { orderId, currentLat: lat, currentLng: lng },
    });

    this.gateway.emitToOrder(orderId, ORDER_EVENTS.DRIVER_LOCATION, {
      orderId,
      lat,
      lng,
      updatedAt: tracking.updatedAt,
    });

    return serializePrisma(tracking);
  }

  async submitOrderReview(orderId: string, rating: number, comment: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) throw new BadRequestException(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Reviews can only be submitted for delivered orders.');
    }

    const existingReview = await this.prisma.restaurantReview.findFirst({
      where: { orderId },
    });
    if (existingReview) {
      throw new BadRequestException('A review has already been submitted for this order.');
    }

    const review = await this.prisma.restaurantReview.create({
      data: {
        orderId,
        restaurantId: order.restaurantId,
        customerId: order.customerId,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment || 'Great food and fast delivery!',
      },
    });

    // Recalculate and update restaurant's aggregate avgRating in database
    const ratingStats = await this.prisma.restaurantReview.aggregate({
      where: { restaurantId: order.restaurantId },
      _avg: { rating: true },
    });

    if (ratingStats._avg.rating !== null && ratingStats._avg.rating !== undefined) {
      await this.prisma.restaurant.update({
        where: { id: order.restaurantId },
        data: { avgRating: Math.round(ratingStats._avg.rating * 10) / 10 },
      });
    }

    return serializePrisma(review);
  }

  async submitSupportTicket(orderId: string, issueType: string, description: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new BadRequestException(`Order ${orderId} not found`);

    const timeline = await this.prisma.orderTimeline.create({
      data: {
        orderId,
        status: order.status,
        message: `Customer Support Issue Reported: [${issueType}] ${description}`,
      },
    });

    return serializePrisma({
      ticketId: `TICKET-${Date.now().toString().slice(-6)}`,
      orderId,
      issueType,
      status: 'OPEN',
      createdAt: timeline.createdAt,
      message: 'Support request submitted. FoodHub Resolution Team will contact you within 15 minutes.',
    });
  }
}
