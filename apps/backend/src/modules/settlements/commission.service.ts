import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CommissionBreakdown {
  grossAmount:    number;
  commission:     number;
  gstOnCommission:number;
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
    // Gross Food Amount = subtotal
    const grossAmount = Number(snap.restaurantGross || order.subtotal || order.totalAmount);
    
    // Strict business rules: 13% commission per order
    const commission = Math.round(((grossAmount * 0.13)) * 100) / 100;
    // 18% GST on Commission
    const gstOnCommission = Math.round(((commission * 0.18)) * 100) / 100;
    // Restaurant Net = Gross - Commission - GST
    const restaurantNet = Math.max(0, Math.round((grossAmount - commission - gstOnCommission) * 100) / 100);

    return {
      grossAmount: Math.round(grossAmount * 100) / 100,
      commission,
      gstOnCommission,
      restaurantNet,
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
    let totalCommission= 0;
    let totalGst       = 0;
    let totalNet       = 0;

    for (const o of orders) {
      const snap: any = o.pricingSnapshot || {};
      const grossAmount = Number(snap.restaurantGross || o.subtotal || o.totalAmount);
      
      const commission = Math.round(((grossAmount * 0.13)) * 100) / 100;
      const gstOnCommission = Math.round(((commission * 0.18)) * 100) / 100;
      const net = Math.max(0, Math.round((grossAmount - commission - gstOnCommission) * 100) / 100);
      
      totalGross       += grossAmount;
      totalCommission  += commission;
      totalGst         += gstOnCommission;
      totalNet         += net;
    }

    return {
      restaurantId,
      orderCount:      orders.length,
      totalGross:      Math.round(totalGross * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalGst:        Math.round(totalGst * 100) / 100,
      totalNet:        Math.round(totalNet * 100) / 100,
    };
  }
}
