import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateRestaurantOpen(restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (!restaurant.isOpen) {
      throw new BadRequestException('Restaurant is currently closed');
    }
    if (restaurant.status !== 'APPROVED') {
      throw new BadRequestException('Restaurant is not accepting orders');
    }
  }

  async validateItemsAvailable(
    items: Array<{ foodItemId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      const foodItem = await this.prisma.foodItem.findUnique({
        where: { id: item.foodItemId },
        include: { inventory: true },
      });
      if (!foodItem) {
        throw new NotFoundException(`Food item ${item.foodItemId} not found`);
      }
      if (!foodItem.isAvailable) {
        throw new BadRequestException(
          `${foodItem.name} is currently unavailable`,
        );
      }
      if (
        foodItem.inventory &&
        foodItem.inventory.stockCount < item.quantity
      ) {
        throw new BadRequestException(
          `Insufficient stock for ${foodItem.name}`,
        );
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
      PENDING:          ['ACCEPTED', 'CANCELLED'],
      ACCEPTED:         ['PREPARING', 'CANCELLED'],
      PREPARING:        ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: ['DRIVER_ASSIGNED'],
      DRIVER_ASSIGNED:  ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED:        ['REFUNDED'],
      CANCELLED:        [],
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
