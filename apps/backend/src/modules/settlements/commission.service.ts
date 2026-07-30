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

    const grossAmount    = Number(order.totalAmount);
    const commissionRate = Number(order.restaurant.commissionRate); // e.g. 20.00
    const platformFee    = Math.round((grossAmount * commissionRate) / 100 * 100) / 100;
    const restaurantNet  = Math.round((grossAmount - platformFee - DRIVER_FLAT_EARNING) * 100) / 100;

    return {
      grossAmount,
      commissionRate,
      platformFee,
      restaurantNet: Math.max(restaurantNet, 0),
      driverEarning: DRIVER_FLAT_EARNING,
    };
  }

  /** Bulk report: summarise commission across a restaurant's delivered orders */
  async getRestaurantCommissionReport(restaurantId: string) {
    const orders = await this.prisma.order.findMany({
      where:   { restaurantId, status: 'DELIVERED' },
      include: { restaurant: true },
    });

    let totalGross     = 0;
    let totalPlatform  = 0;
    let totalNet       = 0;

    for (const o of orders) {
      const rate        = Number(o.restaurant.commissionRate);
      const gross       = Number(o.totalAmount);
      const platform    = Math.round((gross * rate) / 100 * 100) / 100;
      const net         = Math.max(gross - platform - DRIVER_FLAT_EARNING, 0);
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
