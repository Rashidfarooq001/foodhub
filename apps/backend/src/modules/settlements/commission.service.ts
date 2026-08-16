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
      : (order.restaurant.commissionRate !== null ? Number(order.restaurant.commissionRate) : 0);
    const platformFee = Number(snap.commissionAmount !== undefined ? snap.commissionAmount : (grossAmount * commissionRate / 100));
    const restaurantNet = Number(snap.restaurantNet !== undefined ? snap.restaurantNet : Math.max(grossAmount - platformFee, 0));

    return {
      grossAmount,
      commissionRate,
      platformFee,
      restaurantNet,
      driverEarning: Number(snap.riderPayout || DRIVER_FLAT_EARNING),
    };
  }

  /** Bulk report: summarise commission across a restaurant's delivered orders from snapshots */
  async getRestaurantCommissionReport(restaurantId: string) {
    const orders = await this.prisma.order.findMany({
      where:   { restaurantId, status: 'DELIVERED' },
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
        : (o.restaurant.commissionRate !== null ? Number(o.restaurant.commissionRate) : 0);
      const platform = Number(snap.commissionAmount !== undefined ? snap.commissionAmount : (gross * rate / 100));
      const net = Number(snap.restaurantNet !== undefined ? snap.restaurantNet : Math.max(gross - platform, 0));
      
      totalGross       += gross;
      totalPlatform    += platform;
      totalNet         += net;
    }

    return {
      restaurantId,
      orderCount:    orders.length,
      totalGross,
      totalPlatform,
      totalNet,
    };
  }
}
