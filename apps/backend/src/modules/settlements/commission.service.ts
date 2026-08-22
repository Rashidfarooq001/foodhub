import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CommissionBreakdown {
  grossAmount:    number;
  commissionRate: number;
  platformFee:    number;
  restaurantNet:  number;
  driverEarning:  number;
}

const DRIVER_FLAT_EARNING = 50; // ₹50 per delivery

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateForOrder(orderId: string): Promise<CommissionBreakdown> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where:   { id: orderId },
      include: { restaurant: true },
    });

    const snap: any = order.pricingSnapshot || {};
    const grossAmount = Number(snap.restaurantGross || order.subtotal || order.totalAmount);
    const commissionRate = snap.commissionRate !== undefined && snap.commissionRate !== null
      ? Number(snap.commissionRate)
      : (order.restaurant.commissionRate !== null && order.restaurant.commissionRate !== undefined ? Number(order.restaurant.commissionRate) : 13.0);
    const platformFee = Number(snap.commissionAmount !== undefined && snap.commissionAmount !== null
      ? snap.commissionAmount
      : Math.round(((grossAmount * commissionRate) / 100) * 100) / 100);
    const restaurantNet = Number(snap.restaurantNet !== undefined && snap.restaurantNet !== null
      ? snap.restaurantNet
      : Math.max(0, Math.round((grossAmount - platformFee) * 100) / 100));

    return {
      grossAmount: Math.round(grossAmount * 100) / 100,
      commissionRate,
      platformFee: Math.round(platformFee * 100) / 100,
      restaurantNet: Math.round(restaurantNet * 100) / 100,
      driverEarning: Number(snap.riderPayout || DRIVER_FLAT_EARNING),
    };
  }

  /** Bulk report: summarise commission across a restaurant's delivered orders from snapshots */
  async getRestaurantCommissionReport(restaurantId: string) {
    const orders = await this.prisma.order.findMany({
      where:   { restaurantId, status: 'DELIVERED', paymentStatus: 'COMPLETED' },
      include: { restaurant: true },
    });

    let totalGross     = 0;
    let totalPlatform  = 0;
    let totalNet       = 0;

    for (const o of orders) {
      const snap: any = o.pricingSnapshot || {};
      const gross = Number(snap.restaurantGross || o.subtotal || o.totalAmount);
      const rate = snap.commissionRate !== undefined && snap.commissionRate !== null
        ? Number(snap.commissionRate)
        : (o.restaurant.commissionRate !== null && o.restaurant.commissionRate !== undefined ? Number(o.restaurant.commissionRate) : 13.0);
      const platform = Number(snap.commissionAmount !== undefined && snap.commissionAmount !== null
        ? snap.commissionAmount
        : Math.round(((gross * rate) / 100) * 100) / 100);
      const net = Number(snap.restaurantNet !== undefined && snap.restaurantNet !== null
        ? snap.restaurantNet
        : Math.max(0, Math.round((gross - platform) * 100) / 100));
      
      totalGross       += gross;
      totalPlatform    += platform;
      totalNet         += net;
    }

    return {
      restaurantId,
      orderCount:    orders.length,
      totalGross:    Math.round(totalGross * 100) / 100,
      totalPlatform: Math.round(totalPlatform * 100) / 100,
      totalNet:      Math.round(totalNet * 100) / 100,
    };
  }
}
