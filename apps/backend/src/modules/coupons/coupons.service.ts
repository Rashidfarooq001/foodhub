import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventsGateway } from '../realtime/events.gateway';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponStatus } from '@prisma/client';

export interface CouponValidationResult {
  valid: boolean;
  discountAmount: number;
  message: string;
  couponId?: string;
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /** Full coupon validation engine — returns discount amount if valid */
  async validateCoupon(
    code: string,
    customerId?: string,
    subtotal: number = 0,
    restaurantId?: string,
  ): Promise<CouponValidationResult> {
    if (!code || !code.trim()) {
      return { valid: false, discountAmount: 0, message: 'Please enter a coupon code' };
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: { equals: cleanCode, mode: 'insensitive' },
      },
    });

    if (!coupon || coupon.status !== CouponStatus.ACTIVE) {
      return { valid: false, discountAmount: 0, message: 'Invalid or inactive coupon code' };
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return { valid: false, discountAmount: 0, message: 'Coupon is not yet active' };
    }
    if (now > coupon.validTill) {
      return { valid: false, discountAmount: 0, message: 'Coupon has expired' };
    }

    if (subtotal < Number(coupon.minOrderVal)) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order value of ₹${coupon.minOrderVal} is required for this coupon`,
      };
    }

    // Check restaurant restrictions if coupon belongs to a specific restaurant
    if (
      (coupon as any).restaurantId &&
      restaurantId &&
      (coupon as any).restaurantId !== restaurantId
    ) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Coupon is not valid for this restaurant',
      };
    }

    // Per-user usage check
    if (customerId) {
      const customerRecord = await this.prisma.customer.findFirst({
        where: { userId: customerId },
      });
      if (customerRecord) {
        const usageCount = await this.prisma.couponUsage.count({
          where: { couponId: coupon.id, customerId: customerRecord.id },
        });
        if (usageCount >= 1) {
          return { valid: false, discountAmount: 0, message: 'You have already used this coupon' };
        }
      }
    }

    // Global usage limit
    const totalUsage = await this.prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (totalUsage >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'Coupon usage limit has been reached' };
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.couponType === 'PERCENTAGE') {
      discountAmount = (subtotal * Number(coupon.discountVal)) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else {
      discountAmount = Math.min(Number(coupon.discountVal), subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      discountAmount: Math.max(0, discountAmount),
      message: `Coupon applied! Saved ₹${discountAmount.toFixed(2)}`,
      couponId: coupon.id,
    };
  }

  /** Suggest the best available coupon for a given subtotal */
  async suggestBestCoupon(customerId: string, subtotal: number) {
    const activeCoupons = await this.prisma.coupon.findMany({
      where: {
        status: CouponStatus.ACTIVE,
        validFrom: { lte: new Date() },
        validTill: { gte: new Date() },
      },
      orderBy: { discountVal: 'desc' },
    });

    let best: { coupon: (typeof activeCoupons)[0]; discountAmount: number } | null = null;

    for (const c of activeCoupons) {
      const result = await this.validateCoupon(c.code, customerId, subtotal);
      if (result.valid && (!best || result.discountAmount > best.discountAmount)) {
        best = { coupon: c, discountAmount: result.discountAmount };
      }
    }

    if (!best) return { found: false };
    return {
      found: true,
      code: best.coupon.code,
      discountAmount: best.discountAmount,
      couponType: best.coupon.couponType,
      message: `Use ${best.coupon.code} to save ₹${best.discountAmount}`,
    };
  }

  /** List all active platform coupons */
  async listActiveCoupons() {
    return this.prisma.coupon.findMany({
      where: { status: CouponStatus.ACTIVE, validTill: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** List all coupons (for admin) */
  async listAllCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: create a new coupon */
  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Coupon code already exists');

    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        couponType: dto.couponType,
        discountVal: dto.discountVal,
        minOrderVal: dto.minOrderVal ?? 0,
        maxDiscount: dto.maxDiscount,
        validFrom: new Date(dto.validFrom),
        validTill: new Date(dto.validTill),
        usageLimit: dto.usageLimit ?? 1000,
        status: CouponStatus.ACTIVE,
      },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'created' });
    return coupon;
  }

  /** Admin: deactivate a coupon */
  async deactivateCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: { status: CouponStatus.INACTIVE },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'deactivated' });
    return coupon;
  }

  async deleteCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.delete({
      where: { id: couponId },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'deleted' });
    return coupon;
  }

  async updateCoupon(couponId: string, dto: CreateCouponDto) {
    const coupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: dto.code.toUpperCase(),
        couponType: dto.couponType,
        discountVal: dto.discountVal,
        minOrderVal: dto.minOrderVal || 0,
        maxDiscount: dto.maxDiscount || null,
        validFrom: new Date(dto.validFrom),
        validTill: new Date(dto.validTill),
        usageLimit: dto.usageLimit || null,
      },
    });
    this.eventsGateway.server.emit('coupon:updated', { couponId: coupon.id, action: 'updated' });
    return coupon;
  }
}
