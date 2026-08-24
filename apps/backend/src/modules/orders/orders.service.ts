import { GeolocationService } from '../geolocation/geolocation.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
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
import { hashOtp } from './order-state-machine.service';
import * as crypto from 'crypto';

/** Generates a unique order number like FH-948210 */
function generateOrderNumber(): string {
  const num = crypto.randomInt(100000, 1000000);
  return `FH-${num}`;
}

/** Generates a cryptographically secure 4-digit numeric delivery OTP */
function generateDeliveryOtp(): string {
  return crypto.randomInt(1000, 10000).toString();
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
    private readonly geolocationService: GeolocationService,
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
      throw new UnauthorizedException('Authenticated customer profile required to place an order.');
    }


    // 1. Validate restaurant open & status
    await this.validation.validateRestaurantOpen(dto.restaurantId);

    // 1.1 Validate delivery radius (server-side security check)
    const calculatedDistanceKm = await this.validation.validateDeliveryRadius(dto.restaurantId, dto.deliveryAddress);

    // 2. Validate items & inventory
    await this.validation.validateItemsAvailable(dto.items, dto.restaurantId);

    // 3. Calculate subtotal with authoritative server-side price resolution
    let subtotal = 0;
    const itemsWithPrices: Array<{
      foodItemId:    string;
      variantId:     string | null;
      variantName:   string | null;
      quantity:      number;
      unitPrice:     number;
      totalPrice:    number;
      addonsJson:    Prisma.InputJsonValue | typeof Prisma.JsonNull;
      itemSnapshot:  Prisma.InputJsonValue | typeof Prisma.JsonNull;
    }> = [];

    for (const item of dto.items) {
      const food = await this.prisma.foodItem.findUnique({
        where: { id: item.foodItemId },
        include: { variants: true },
      });
      if (!food) {
        throw new BadRequestException(`Food item ${item.foodItemId} not found.`);
      }

      if (food.restaurantId !== dto.restaurantId) {
        throw new BadRequestException(`Food item "${food.name}" does not belong to restaurant ${dto.restaurantId}.`);
      }

      let resolvedUnitPrice = Number(food.price);
      let selectedVariantName: string | null = null;
      let selectedVariantId: string | null = null;

      if (item.variantId) {
        const variant = (food.variants || []).find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found for "${food.name}".`);
        }
        if (!variant.isAvailable) {
          throw new BadRequestException(`Variant "${variant.variantName}" of "${food.name}" is currently unavailable.`);
        }
        resolvedUnitPrice = Number(variant.price);
        selectedVariantId = variant.id;
        selectedVariantName = variant.variantName;
      } else if (item.variantName) {
        const variant = (food.variants || []).find(
          (v) => v.variantName.toLowerCase() === item.variantName!.toLowerCase(),
        );
        if (variant) {
          if (!variant.isAvailable) {
            throw new BadRequestException(`Variant "${variant.variantName}" of "${food.name}" is currently unavailable.`);
          }
          resolvedUnitPrice = Number(variant.price);
          selectedVariantId = variant.id;
          selectedVariantName = variant.variantName;
        }
      }

      const addonTotal = item.addonsJson
        ? (item.addonsJson as Array<{ price: number }>).reduce(
            (sum, a) => sum + (a.price || 0), 0,
          )
        : 0;
      const unitPrice  = resolvedUnitPrice + addonTotal;
      const totalPrice = unitPrice * item.quantity;
      subtotal        += totalPrice;

      const itemSnapshot = {
        foodItemId: food.id,
        foodName: food.name,
        variantId: selectedVariantId,
        variantName: selectedVariantName,
        basePrice: resolvedUnitPrice,
        addonTotal,
        unitPrice,
        quantity: item.quantity,
        totalPrice,
      };

      itemsWithPrices.push({
        foodItemId:   item.foodItemId,
        variantId:    selectedVariantId,
        variantName:  selectedVariantName,
        quantity:     item.quantity,
        unitPrice,
        totalPrice,
        addonsJson: item.addonsJson
          ? (item.addonsJson as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        itemSnapshot: itemSnapshot as unknown as Prisma.InputJsonValue,
      });
    }

    // 4. Validate minimum order
    await this.validation.validateMinimumOrder(dto.restaurantId, subtotal);

    // 5. Zero discount (No coupon system)
    const discountAmount = 0;

    // Construct authoritative immutable deliveryAddress snapshot & calculate Mappls road distance
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
      formattedAddressText = 'Location address not provided';
    }

    const placeNameText = typeof rawAddress === 'object' && rawAddress.placeName
      ? rawAddress.placeName
      : (formattedAddressText.split(',')[0] || 'Delivery Address');

    const latitudeNum = typeof rawAddress === 'object' && typeof rawAddress.latitude === 'number'
      ? rawAddress.latitude
      : ((dto as any).latitude || (dto as any).lat);

    const longitudeNum = typeof rawAddress === 'object' && typeof rawAddress.longitude === 'number'
      ? rawAddress.longitude
      : ((dto as any).longitude || (dto as any).lng);

    const locationSourceText = typeof rawAddress === 'object' && rawAddress.locationSource
      ? rawAddress.locationSource
      : ((dto as any).locationSource || 'CURRENT_GPS');

    // Fetch restaurant coordinates for authoritative server-side distance calculation
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    const restLat = restaurant ? Number(restaurant.latitude) : 0;
    const restLng = restaurant ? Number(restaurant.longitude) : 74.5221;

    this.logger.log({
      msg: 'Order creation input',
      restaurantId: dto.restaurantId,
      itemCount: dto.items.length,
      locationSource: locationSourceText,
      latitude: latitudeNum,
      longitude: longitudeNum,
    });

    // Authoritative Quote Calculation (Customer Packaging Fee = ₹0)
    const quote = await this.quoteService.calculateQuote({
      foodSubtotal: subtotal,
      distanceKm: calculatedDistanceKm,
      restaurantId: dto.restaurantId,
      discountAmount,
      packagingFee: 0,
      tipAmount: (dto as any).tipAmount || 0,
    });

    this.logger.log({
      msg: 'Order quote calculated',
      calculatedDistanceKm: quote.distanceKm,
      calculatedDeliveryFee: quote.customerDeliveryFee,
      calculatedCustomerTaxes: quote.totalCustomerTaxes,
      calculatedCustomerTotal: quote.customerTotal,
    });

    const deliveryFee = quote.customerDeliveryFee;
    const taxAmount = quote.totalCustomerTaxes;
    const totalAmount = quote.customerTotal;

    const pricingSnapshot = {
      commissionRate: quote.commissionRate,
      commissionStatus: quote.commissionStatus,
      commissionAmount: quote.restaurantCommission,
      commissionGstAmount: quote.restaurantCommissionGst,
      restaurantCommissionPercent: quote.restaurantCommissionPercent,
      restaurantCommissionAmount: quote.restaurantCommission,
      restaurantCommissionGst: quote.restaurantCommissionGst,
      restaurantGross: subtotal,
      restaurantNet: quote.restaurantSettlement,
      platformRevenue: quote.platformOperatingRevenue,
      platformFee: quote.platformFee,
      smallOrderThreshold: 0,
      smallOrderSurcharge: 0,
      customerDeliveryFee: quote.customerDeliveryFee,
      deliveryDistanceKm: quote.deliveryDistanceKm,
      deliveryFeeBaseKm: quote.deliveryFeeBaseKm,
      deliveryFeeBaseAmount: quote.deliveryFeeBaseAmount,
      deliveryFeePerExtraKm: quote.deliveryFeePerExtraKm,
      riderBasePayout: quote.riderBasePay,
      riderPerKmRate: 6,
      riderPayout: quote.totalRiderPayout,
      paymentGatewayCost: quote.paymentGatewayCost,
      restaurantSettlement: quote.restaurantSettlement,
      packagingFee: 0,
      discountAmount,
      statutoryGstLiability: 0,
      platformContributionMargin: quote.platformContributionMargin,
    };

    const deliveryAddressSnapshot = {
      placeName: placeNameText,
      formattedAddress: formattedAddressText,
      addressLine1: typeof rawAddress === 'object' ? (rawAddress.addressLine1 || placeNameText) : formattedAddressText,
      addressLine2: typeof rawAddress === 'object' ? (rawAddress.addressLine2 || '') : '',
      landmark: typeof rawAddress === 'object' ? (rawAddress.landmark || '') : '',
      city: typeof rawAddress === 'object' ? (rawAddress.city || '') : '',
      state: typeof rawAddress === 'object' ? (rawAddress.state || 'Jammu & Kashmir') : 'Jammu & Kashmir',
      postalCode: typeof rawAddress === 'object' ? (rawAddress.postalCode || '193502') : '193502',
      latitude: latitudeNum,
      longitude: longitudeNum,
      locationSource: locationSourceText,
      verificationStatus: 'VERIFIED',
      distanceKm: quote.distanceKm,
      deliveryFee: quote.customerDeliveryFee,
    };

    // 7. Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const rawDeliveryOtp = generateDeliveryOtp();
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
          deliveryOtp:        rawDeliveryOtp,
          deliveryOtpHash:    hashOtp(rawDeliveryOtp),
          deliveryOtpExpiresAt: new Date(Date.now() + 120 * 60 * 1000),
          specialInstruction: dto.specialInstruction,
        },
      });

      // Create order items via createMany with complete variant & snapshot fields
      await tx.orderItem.createMany({
        data: itemsWithPrices.map((item) => ({
          orderId:      newOrder.id,
          foodItemId:   item.foodItemId,
          variantId:    item.variantId,
          variantName:  item.variantName,
          quantity:     item.quantity,
          unitPrice:    item.unitPrice,
          totalPrice:   item.totalPrice,
          addonsJson:   item.addonsJson,
          itemSnapshot: item.itemSnapshot,
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

    // 9. Emit real-time event to restaurant — ONLY for COD orders.
    // Online payment orders (UPI, CARD, NETBANKING, WALLET, etc.) must NOT appear in
    // the restaurant queue until server-side payment verification succeeds.
    // The PaymentsService emits ORDER_CREATED after verifyPayment() or the Razorpay webhook fires.
    if (dto.paymentMethod === 'COD') {
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
        distanceKm: quote.distanceKm,
        locationSource: locationSourceText,
        paymentMethod: dto.paymentMethod,
        paymentVerified: true,
      });
    }

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

  async repeatOrder(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { foodItem: true } },
        restaurant: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    return serializePrisma({
      orderId: order.id,
      restaurantId: order.restaurantId,
      restaurantName: order.restaurant?.name || 'Restaurant',
      items: order.orderItems.map((item) => ({
        foodItemId: item.foodItemId,
        name: item.foodItem?.name || 'Food Item',
        price: Number(item.unitPrice),
        quantity: item.quantity,
        addonsJson: item.addonsJson ?? undefined,
      })),
      totalAmount: Number(order.totalAmount),
    });
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

    if (status === 'DELIVERED') {
      if (!otp) {
        throw new BadRequestException('Delivery confirmation OTP is required.');
      }
      const isOtpValid = order.deliveryOtp === otp || (order.deliveryOtpHash && hashOtp(otp) === order.deliveryOtpHash);
      if (!isOtpValid) {
        throw new BadRequestException('Invalid Delivery OTP');
      }
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

  // --- CUSTOMER ORDER TRACKING & HISTORY METHODS ---

  async getActiveCustomerOrder(userId: string) {
    try {
      const activeOrder = await this.prisma.order.findFirst({
        where: {
          customer: { userId },
          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.ACCEPTED,
              OrderStatus.PREPARING,
              OrderStatus.READY_FOR_PICKUP,
              OrderStatus.DRIVER_ASSIGNED,
              OrderStatus.ARRIVED_AT_RESTAURANT,
              OrderStatus.PICKED_UP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
          deletedAt: null,
        },
        include: {
          restaurant: true,
          orderItems: { include: { foodItem: true } },
          orderTimelines: { orderBy: { createdAt: 'asc' } },
          tracking: true,
          assignedRestaurantDriver: true,
          deliveryJob: {
            include: {
              driver: {
                include: {
                  user: { include: { profile: true } },
                  vehicles: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeOrder) return null;

      const deliveryAddress: any = activeOrder.deliveryAddress || {};
      const restaurantLat = activeOrder.restaurant ? Number(activeOrder.restaurant.latitude || 0) : 0;
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

      const foodHubDriver = activeOrder.deliveryJob?.driver;
      const driverProfile = foodHubDriver?.user?.profile;
      const driverName = driverProfile
        ? `${driverProfile.firstName} ${driverProfile.lastName || ''}`.trim()
        : activeOrder.assignedRestaurantDriver
        ? `${activeOrder.assignedRestaurantDriver.firstName} ${activeOrder.assignedRestaurantDriver.lastName || ''}`.trim()
        : 'Assigned Partner';

      const driverPhone = foodHubDriver?.user?.phone || activeOrder.assignedRestaurantDriver?.phone || '+919876543210';
      const vehicleNumber = foodHubDriver?.vehicles?.[0]?.vehicleNumber || activeOrder.assignedRestaurantDriver?.vehicleNumber || 'JK-15-A-1001';

      return serializePrisma({
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        restaurantName: activeOrder.restaurant?.name || 'FoodHub Restaurant',
        restaurantAddress: activeOrder.restaurant?.addressLine || '',
        restaurantLat,
        restaurantLng,
        customerAddress: customerAddressText,
        customerLat,
        customerLng,
        driverLat,
        driverLng,
        driverName,
        driverPhone,
        vehicleNumber,
        deliveryOtp: activeOrder.status === OrderStatus.OUT_FOR_DELIVERY ? activeOrder.deliveryOtp : undefined,
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
    let whereClause: any = {
      customer: { userId },
      deletedAt: null,
    };

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        whereClause.status = {
          in: [
            OrderStatus.PENDING,
            OrderStatus.ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.DRIVER_ASSIGNED,
            OrderStatus.ARRIVED_AT_RESTAURANT,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        };
      } else if (statusFilter === 'DELIVERED') {
        whereClause.status = OrderStatus.DELIVERED;
      } else if (statusFilter === 'CANCELLED') {
        whereClause.status = {
          in: [
            OrderStatus.CANCELLED,
            OrderStatus.REJECTED,
            OrderStatus.FAILED,
          ],
        };
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
        deliveryJob: {
          include: {
            driver: {
              include: {
                user: { include: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return serializePrisma(
      orders.map((ord) => ({
        id: ord.id,
        orderNumber: ord.orderNumber,
        restaurantName: ord.restaurant?.name || 'Restaurant',
        restaurantBanner: ord.restaurant?.bannerUrl,
        date: ord.createdAt.toLocaleDateString() + ' ' + ord.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: ord.createdAt,
        deliveredAt: ord.deliveryJob?.deliveredAt || ord.deliveryOtpVerifiedAt || ord.updatedAt,
        totalAmount: Number(ord.totalAmount),
        itemCount: ord.orderItems.reduce((acc, i) => acc + i.quantity, 0),
        itemsSummary: ord.orderItems.map((i) => `${i.quantity}x ${i.foodItem?.name || 'Item'}`).join(', '),
        items: ord.orderItems.map((i) => ({
          id: i.id,
          name: i.foodItem?.name || 'Item',
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
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

    // STRICT CUSTOMER, RESTAURANT & DRIVER AUTHORIZATION CHECK
    const isCustomerOwner =
      order.customer.userId === userId ||
      order.customerId === userId ||
      order.customer.id === userId;
    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

    let isAuthorized = isCustomerOwner || isAdmin;

    if (!isAuthorized && (role === 'RESTAURANT_OWNER' || role === 'RESTAURANT_MANAGER' || role === 'RESTAURANT_STAFF')) {
      const isOwner = order.restaurant.ownerId === userId;
      const isStaff = await this.prisma.restaurantStaff.findFirst({
        where: { restaurantId: order.restaurantId, userId },
        select: { id: true },
      });
      if (isOwner || isStaff) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && (role === 'DRIVER' || role === 'DELIVERY_PARTNER')) {
      const driver = await this.prisma.driver.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (driver) {
        const isAssigned = order.assignedRestaurantDriverId === driver.id;
        const job = await this.prisma.deliveryJob.findFirst({
          where: { orderId: order.id, driverId: driver.id },
          select: { id: true },
        });
        if (isAssigned || job) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to view this order.');
    }

    const serialized: any = serializePrisma(order);
    if (!isAdmin) {
      delete serialized.pricingSnapshot;
    }

    // STRICT DELIVERY OTP PRIVACY:
    // Only the authenticated ordering customer receives deliveryOtp, and ONLY when the order is OUT_FOR_DELIVERY
    if (isCustomerOwner && order.status === OrderStatus.OUT_FOR_DELIVERY) {
      if (!order.deliveryOtp || order.deliveryOtp === 'USED') {
        const generatedOtp = generateDeliveryOtp();
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            deliveryOtp: generatedOtp,
            deliveryOtpHash: hashOtp(generatedOtp),
            deliveryOtpExpiresAt: new Date(Date.now() + 120 * 60 * 1000),
          },
        });
        serialized.deliveryOtp = generatedOtp;
      } else {
        serialized.deliveryOtp = order.deliveryOtp;
      }
    } else {
      delete serialized.deliveryOtp;
      delete serialized.deliveryOtpHash;
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

    let isAuthorized = isCustomerOwner || isAdmin;

    if (!isAuthorized && (role === 'RESTAURANT_OWNER' || role === 'RESTAURANT_MANAGER' || role === 'RESTAURANT_STAFF')) {
      const isOwner = order.restaurant.ownerId === userId;
      const isStaff = await this.prisma.restaurantStaff.findFirst({
        where: { restaurantId: order.restaurantId, userId },
        select: { id: true },
      });
      if (isOwner || isStaff) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && (role === 'DRIVER' || role === 'DELIVERY_PARTNER')) {
      const driver = await this.prisma.driver.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (driver) {
        const isAssigned = order.assignedRestaurantDriverId === driver.id;
        const job = await this.prisma.deliveryJob.findFirst({
          where: { orderId: order.id, driverId: driver.id },
          select: { id: true },
        });
        if (isAssigned || job) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
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

    let customerDeliveryOtp: string | undefined = undefined;
    if (isCustomerOwner && order.status === OrderStatus.OUT_FOR_DELIVERY) {
      if (!order.deliveryOtp || order.deliveryOtp === 'USED') {
        const generatedOtp = generateDeliveryOtp();
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            deliveryOtp: generatedOtp,
            deliveryOtpHash: hashOtp(generatedOtp),
            deliveryOtpExpiresAt: new Date(Date.now() + 120 * 60 * 1000),
          },
        });
        customerDeliveryOtp = generatedOtp;
      } else {
        customerDeliveryOtp = order.deliveryOtp;
      }
    }

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
      deliveryOtp: customerDeliveryOtp,
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

  async getOrderInvoice(orderId: string, userId: string, role?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        customer: { include: { user: { include: { profile: true } } } },
        orderItems: true,
      },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    const isCustomer = order.customer?.userId === userId;
    const isRestaurantOwner = order.restaurant?.ownerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isCustomer && !isRestaurantOwner && !isAdmin) {
      throw new BadRequestException('Access denied. You do not have permission to view this invoice.');
    }

    let invoice = await this.prisma.invoice.findUnique({
      where: { orderId: order.id },
    });

    if (!invoice) {
      const invoiceNumber = `INV-${order.orderNumber}`;
      invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          pdfUrl: `/api/orders/${order.id}/invoice/pdf`,
        },
      });
    }

    const snap: any = order.pricingSnapshot || {};

    const foodSubtotal = snap.restaurantGross !== undefined ? Number(snap.restaurantGross) : Number(order.subtotal || 0);
    const platformFee = snap.platformFee !== undefined ? Number(snap.platformFee) : 3.0;
    const totalCustomerTaxes = snap.totalCustomerTaxes !== undefined ? Number(snap.totalCustomerTaxes) : 0;
    const discountAmount = snap.discountAmount !== undefined ? Number(snap.discountAmount) : 0;
    const customerTotal = Number(order.totalAmount);

    const commissionRate = snap.commissionRate !== undefined ? Number(snap.commissionRate) : 13.0;
    const commissionAmount = snap.commissionAmount !== undefined ? Number(snap.commissionAmount) : Math.round((foodSubtotal * commissionRate) / 100 * 100) / 100;
    
    const commissionGstAmount = snap.commissionGstAmount !== undefined 
      ? Number(snap.commissionGstAmount) 
      : snap.restaurantCommissionGst !== undefined 
      ? Number(snap.restaurantCommissionGst)
      : Math.round(commissionAmount * 0.18 * 100) / 100;

    const restaurantNet = snap.restaurantNet !== undefined ? Number(snap.restaurantNet) : Math.round((foodSubtotal - commissionAmount - commissionGstAmount) * 100) / 100;
    const deliveryFee = snap.customerDeliveryFee !== undefined ? Number(snap.customerDeliveryFee) : 0;
    const packagingFee = snap.packagingFee !== undefined ? Number(snap.packagingFee) : 0;

    return serializePrisma({
      invoiceDetails: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        createdAt: invoice.createdAt,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        pdfUrl: invoice.pdfUrl,
      },
      customerInvoice: {
        title: 'Customer Invoice / Receipt',
        foodSubtotal,
        packagingFee,
        deliveryFee,
        taxes: totalCustomerTaxes,
        platformFee,
        discounts: discountAmount,
        totalPaid: customerTotal,
        note: 'Platform Fee is a customer-side charge.',
      },
      restaurantStatement: {
        title: 'Restaurant Settlement Statement',
        grossSales: foodSubtotal,
        commissionRate,
        commissionDeduction: commissionAmount,
        commissionGstDeduction: commissionGstAmount,
        platformFeeDeduction: 0,
        netPayable: restaurantNet,
        note: 'Customer platform fee is excluded from restaurant deductions.',
      },
      items: order.orderItems.map((item: any) => ({
        name: (item.itemSnapshot as any)?.foodName || 'Item',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      parties: {
        restaurant: {
          name: order.restaurant.name,
          address: (order.restaurant as any).addressLine || 'Registered Address',
        },
        customer: {
          name: order.customer?.user?.profile 
            ? `${order.customer.user.profile.firstName} ${order.customer.user.profile.lastName || ''}`.trim() 
            : 'Customer',
        }
      }
    });
  }
}
