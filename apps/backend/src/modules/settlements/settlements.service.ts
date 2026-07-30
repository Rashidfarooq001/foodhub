import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CommissionService } from './commission.service';

function generateUTR(): string {
  return `UTR${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    private readonly prisma:      PrismaService,
    private readonly commission:  CommissionService,
  ) {}

  /** List all restaurants with unsettled delivered orders */
  async getPendingSettlements() {
    const result = await this.prisma.order.groupBy({
      by:     ['restaurantId'],
      where:  { status: 'DELIVERED', paymentStatus: 'COMPLETED' },
      _sum:   { totalAmount: true },
      _count: { id: true },
    });

    return result.map((r) => ({
      restaurantId:   r.restaurantId,
      orderCount:     r._count.id,
      grossAmount:    Number(r._sum.totalAmount ?? 0),
    }));
  }

  /** Process a manual or scheduled settlement for a restaurant */
  async processRestaurantSettlement(restaurantId: string) {
    const report = await this.commission.getRestaurantCommissionReport(restaurantId);

    if (report.orderCount === 0) {
      return { message: 'No pending orders to settle', restaurantId };
    }

    const utr = generateUTR();
    const settlement = await this.prisma.settlement.create({
      data: {
        restaurantId,
        amount:    report.totalNet,
        utrNumber: utr,
      },
    });

    this.logger.log(
      `Settlement processed for ${restaurantId}: ₹${report.totalNet} (UTR: ${utr})`,
    );

    return {
      message:      'Settlement processed',
      settlementId: settlement.id,
      utr,
      amount:       report.totalNet,
      orderCount:   report.orderCount,
    };
  }

  /** Get settlement history for a restaurant */
  async getSettlementHistory(restaurantId: string) {
    return this.prisma.settlement.findMany({
      where:   { restaurantId },
      orderBy: { settledAt: 'desc' },
    });
  }

  /** Credit DriverWallet for all unpaid delivery assignments */
  async processDriverSettlement(driverId: string) {
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: { driverId, status: 'DELIVERED' },
    });

    if (assignments.length === 0) {
      return { message: 'No pending driver earnings', driverId };
    }

    const totalEarning = assignments.reduce(
      (sum, a) => sum + Number(a.payoutAmount),
      0,
    );

    let wallet = await this.prisma.driverWallet.findUnique({
      where: { driverId },
    });

    if (!wallet) {
      wallet = await this.prisma.driverWallet.create({
        data: { driverId, balance: 0 },
      });
    }

    await this.prisma.driverWallet.update({
      where: { driverId },
      data:  { balance: { increment: totalEarning } },
    });

    this.logger.log(
      `Driver ${driverId} credited ₹${totalEarning} for ${assignments.length} deliveries`,
    );

    return {
      message:      'Driver earnings credited',
      driverId,
      totalEarning,
      deliveries:   assignments.length,
    };
  }
}
