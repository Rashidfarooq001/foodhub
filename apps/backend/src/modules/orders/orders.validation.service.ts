import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DistanceService } from '../geolocation/distance.service';
import { OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly distanceService: DistanceService,
  ) {}

  async validateRestaurantOpen(restaurantId: string): Promise<void> {
    if (!restaurantId || typeof restaurantId !== 'string' || !restaurantId.trim()) {
      throw new BadRequestException('Valid restaurantId is required');
    }
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for ID ${restaurantId}`);
    }
    if (!restaurant.isOpen) {
      throw new BadRequestException('Restaurant is currently closed');
    }
    if (restaurant.status !== 'APPROVED') {
      throw new BadRequestException('Restaurant is not accepting orders');
    }
  }

  async validateDeliveryRadius(restaurantId: string, deliveryAddress: any): Promise<number> {
    if (!restaurantId || typeof restaurantId !== 'string' || !restaurantId.trim()) {
      throw new BadRequestException('Valid restaurantId is required');
    }
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant not found for ID ${restaurantId}`);
    }

    const restLat = Number(restaurant.latitude);
    const restLng = Number(restaurant.longitude);
    const radiusKm = Number(restaurant.deliveryRadius ?? 15.0);

    if (!restLat || !restLng || (restLat === 0 && restLng === 0) || isNaN(restLat) || isNaN(restLng)) {
      throw new BadRequestException('Restaurant location unavailable for delivery calculation.');
    }

    const custLat = deliveryAddress?.latitude ? Number(deliveryAddress.latitude) : null;
    const custLng = deliveryAddress?.longitude ? Number(deliveryAddress.longitude) : null;

    if (custLat === null || custLng === null || (custLat === 0 && custLng === 0) || isNaN(custLat) || isNaN(custLng)) {
      if (deliveryAddress?.locationSource === 'MANUAL_ADDRESS') {
        return 0; // Manual address bypassed routing
      }
      throw new BadRequestException('Delivery coordinates are missing. Please provide a valid verified address.');
    }

    const distResult = await this.distanceService.getDeliveryDistance(restaurantId, custLat, custLng);
    const distanceKm = distResult.distanceKm;

    if (!distResult.valid) {
      if (distResult.reason === 'ROUTE_CALCULATION_FAILED') {
        throw new BadRequestException('Delivery route could not be calculated. The delivery service may be temporarily unavailable.');
      }
      if (distResult.reason === 'INVALID_RESTAURANT_COORDINATES' || distResult.reason === 'INVALID_CUSTOMER_COORDINATES') {
        throw new BadRequestException('Invalid coordinates provided for delivery calculation.');
      }
      throw new BadRequestException(
        `Your selected delivery location (${distanceKm} km away) is outside this restaurant's delivery area of ${radiusKm} km.`,
      );
    }

    return distanceKm;
  }

  async validateItemsAvailable(
    items: Array<{ foodItemId: string; variantId?: string; quantity: number }>,
    restaurantId?: string,
  ): Promise<void> {
    for (const item of items) {
      const foodItem = await this.prisma.foodItem.findUnique({
        where: { id: item.foodItemId },
        include: { variants: true },
      });

      if (!foodItem) {
        throw new NotFoundException(`Food item ${item.foodItemId} not found`);
      }

      if (restaurantId && foodItem.restaurantId !== restaurantId) {
        throw new BadRequestException(`Food item ${foodItem.name} does not belong to the specified restaurant.`);
      }

      if (!foodItem.isAvailable) {
        throw new BadRequestException(
          `"${foodItem.name}" is currently unavailable from the kitchen.`,
        );
      }

      // If item has variants, validate variant
      if (item.variantId) {
        const variant = (foodItem.variants || []).find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found for item "${foodItem.name}"`);
        }
        if (!variant.isAvailable) {
          throw new BadRequestException(`Variant "${variant.variantName}" of "${foodItem.name}" is currently unavailable.`);
        }
      } else if (foodItem.variants && foodItem.variants.length > 0) {
        // If foodItem has multiple variants, require a variant selection
        const availableVariants = foodItem.variants.filter((v) => v.isAvailable);
        if (availableVariants.length > 0) {
          // If customer didn't send variantId but item requires variant, default or warn
        }
      }
    }
  }

  async validateMinimumOrder(
    restaurantId: string,
    subtotal: number,
  ): Promise<void> {
    const setting = await this.prisma.restaurantSetting.findUnique({
      where: { restaurantId },
    });
    const minOrder = 50; // Platform default ₹50
    if (subtotal < minOrder) {
      throw new BadRequestException(
        `Minimum order value is ₹${minOrder}`,
      );
    }
  }

  async validateAndApplyCoupon(
    couponCode: string,
    customerId: string,
    subtotal: number,
  ): Promise<number> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    if (!coupon || coupon.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or expired coupon code');
    }
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTill) {
      throw new BadRequestException('Coupon is not valid at this time');
    }
    if (subtotal < Number(coupon.minOrderVal)) {
      throw new BadRequestException(
        `Minimum order ₹${coupon.minOrderVal} required for this coupon`,
      );
    }
    const alreadyUsed = await this.prisma.couponUsage.findFirst({
      where: { couponId: coupon.id, customerId },
    });
    if (alreadyUsed) {
      throw new BadRequestException('You have already used this coupon');
    }
    if (coupon.couponType === 'PERCENTAGE') {
      const discount = (subtotal * Number(coupon.discountVal)) / 100;
      const maxDiscount = coupon.maxDiscount ? Number(coupon.maxDiscount) : Infinity;
      return Math.min(discount, maxDiscount);
    }
    return Math.min(Number(coupon.discountVal), subtotal);
  }

  async validateWalletBalance(userId: string, amount: number): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
  }

  /** Validate order status transitions through the state machine */
  validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      PENDING:          ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED:         ['PREPARING', 'CANCELLED'],
      PREPARING:        ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['DRIVER_ASSIGNED', 'CANCELLED'],
      DRIVER_ASSIGNED:  ['ARRIVED_AT_RESTAURANT', 'CANCELLED'],
      ARRIVED_AT_RESTAURANT: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP:        ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED:        ['REFUNDED'],
      REJECTED:         [],
      CANCELLED:        [],
      FAILED:           [],
      REFUNDED:         [],
    };

    const allowed = allowedTransitions[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
