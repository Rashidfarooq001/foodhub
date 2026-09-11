import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CommissionService } from './commission.service';
import { OrdersGateway } from '../orders/orders.gateway';

function getWeeklyPeriod(type = 'current', customStart?: string, customEnd?: string) {
  const now = new Date();
  if (type === 'custom' && customStart && customEnd) {
    return {
      periodStart: new Date(customStart),
      periodEnd: new Date(customEnd),
      periodLabel: 'Custom Range',
    };
  }

  let periodStart = new Date(now);
  let periodEnd = new Date(now);
  let periodLabel = 'Current Period';

  if (type === 'today') {
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);
    periodLabel = 'Today';
  } else if (type === 'yesterday') {
    periodStart.setDate(now.getDate() - 1);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setDate(now.getDate() - 1);
    periodEnd.setHours(23, 59, 59, 999);
    periodLabel = 'Yesterday';
  } else if (type === 'monthly') {
    periodStart.setDate(now.getDate() - 30);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);
    periodLabel = 'Last 30 Days';
  } else {
    // current defaults to Last 7 Days instead of a calendar week
    periodStart.setDate(now.getDate() - 7);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);
    periodLabel = 'Last 7 Days';
  }

  return { periodStart, periodEnd, periodLabel };
}

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly commission: CommissionService,
    private readonly gateway?: OrdersGateway,
  ) {}

  async verifyRestaurantOwner(restaurantId: string, userId: string): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, ownerId: userId },
      select: { id: true },
    });
    if (restaurant) return true;
    const staff = await this.prisma.restaurantStaff.findFirst({
      where: { restaurantId, userId },
      select: { id: true },
    });
    return !!staff;
  }

  async getFinanceOverview(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const [restSettlements, riderSettlements, orders] = await Promise.all([
      this.prisma.restaurantSettlement.findMany({
        where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
      }),
      this.prisma.riderSettlement.findMany({
        where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
      }),
      this.prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: period.periodStart, lte: period.periodEnd },
        },
        select: { pricingSnapshot: true },
      }),
    ]);

    let totalGrossSales = 0,
      totalRestaurantPayable = 0,
      pendingRestaurantSettlements = 0,
      paidRestaurantSettlements = 0,
      failedSettlements = 0,
      totalCommission = 0;
    for (const s of restSettlements) {
      totalGrossSales += Number(s.grossAmount);
      totalRestaurantPayable += Number(s.netPayable);
      totalCommission += Number(s.commissionAmount);
      if (s.status === 'PAID') paidRestaurantSettlements += Number(s.netPayable);
      else if (s.status === 'FAILED') failedSettlements++;
      else pendingRestaurantSettlements += Number(s.netPayable);
    }

    let totalRiderPayable = 0,
      pendingRiderSettlements = 0,
      paidRiderSettlements = 0;
    for (const s of riderSettlements) {
      const net = Number(s.netPayable);
      totalRiderPayable += net;
      if (s.status === 'PAID') paidRiderSettlements += net;
      else pendingRiderSettlements += net;
    }

    let totalPlatformRevenue = 0;
    for (const o of orders) {
      const snap: any = o.pricingSnapshot || {};
      totalPlatformRevenue += Number(snap.platformFee || 0) + Number(snap.commissionAmount || 0);
    }

    return {
      period,
      overview: {
        orderCount: orders.length,
        grossSales: Math.round(totalGrossSales * 100) / 100,
        restaurantPayable: Math.round(totalRestaurantPayable * 100) / 100,
        riderPayable: Math.round(totalRiderPayable * 100) / 100,
        zaykaRevenue: Math.round(totalPlatformRevenue * 100) / 100,
        pendingRestaurantSettlements: Math.round(pendingRestaurantSettlements * 100) / 100,
        pendingRiderSettlements: Math.round(pendingRiderSettlements * 100) / 100,
        paidRestaurantSettlements: Math.round(paidRestaurantSettlements * 100) / 100,
        paidRiderSettlements: Math.round(paidRiderSettlements * 100) / 100,
        failedSettlements,
      },
    };
  }

  async getWeeklyRestaurantSettlements(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const restaurants = await this.prisma.restaurant.findMany({
      select: { id: true, name: true, phone: true, email: true, status: true, bankAccount: true },
    });
    const settlements = await this.prisma.restaurantSettlement.findMany({
      where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
    });

    let totalGmv = 0,
      totalCommission = 0,
      totalRestaurantPayable = 0,
      totalAlreadyPaid = 0,
      totalPendingPayable = 0;
    const summaryMap = new Map();
    for (const r of restaurants)
      summaryMap.set(r.id, {
        restaurant: r,
        orderCount: 0,
        grossSales: 0,
        commissionAmount: 0,
        netPayable: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: 'PENDING',
      });

    for (const s of settlements) {
      const entry = summaryMap.get(s.restaurantId);
      if (entry) {
        const net = Number(s.netPayable);
        entry.orderCount++;
        entry.grossSales += Number(s.grossAmount);
        entry.commissionAmount += Number(s.commissionAmount);
        entry.netPayable += net;
        if (s.status === 'PAID') {
          entry.paidAmount += net;
          entry.status = 'PAID';
        } else {
          entry.pendingAmount += net;
          entry.status = 'PENDING';
        }
        totalGmv += Number(s.grossAmount);
        totalCommission += Number(s.commissionAmount);
        totalRestaurantPayable += net;
        if (s.status === 'PAID') totalAlreadyPaid += net;
        else totalPendingPayable += net;
      }
    }

    return {
      period,
      summary: {
        totalOrders: settlements.length,
        weeklyGmv: totalGmv,
        totalCommission,
        totalRestaurantPayable,
        totalAlreadyPaid,
        totalPendingPayable,
        failedCount: 0,
      },
      data: Array.from(summaryMap.values()),
    };
  }

  async getRestaurantSettlementDetail(
    restaurantId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const settlements = await this.prisma.restaurantSettlement.findMany({
      where: {
        restaurantId,
        periodStart: { gte: period.periodStart },
        periodEnd: { lte: period.periodEnd },
      },
      include: { order: { include: { customer: { include: { user: { include: { profile: true } } } } } } },
    });

    let grossSales = 0,
      commissionAmount = 0,
      netPayable = 0,
      paidAmount = 0,
      pendingAmount = 0;
    const orders = settlements.map((s) => {
      grossSales += Number(s.grossAmount);
      commissionAmount += Number(s.commissionAmount);
      netPayable += Number(s.netPayable);
      if (s.status === 'PAID') paidAmount += Number(s.netPayable);
      else pendingAmount += Number(s.netPayable);
      return {
        orderId: s.orderId,
        orderNumber: s.order?.orderNumber,
        status: s.order?.status,
        customerName: s.order?.customer?.user?.profile?.firstName || 'Customer',
        deliveredAt: s.periodStart,
        totalAmount: s.grossAmount,
        commissionAmount: s.commissionAmount,
        netPayable: s.netPayable,
      };
    });

    return {
      restaurantId,
      period,
      financialSummary: {
        orderCount: settlements.length,
        grossSales,
        commissionAmount,
        netPayable,
        paidAmount,
        pendingAmount,
        status: pendingAmount === 0 ? 'PAID' : 'PENDING',
      },
      orders,
    };
  }

  async recordRestaurantPayment(
    restaurantId: string,
    dto: { amount: number; paymentMethod: string; transactionReference: string; notes?: string },
    adminUserId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    
    return await this.prisma.$transaction(async (tx) => {
      // 1. Find pending settlements
      const pendingSettlements = await tx.restaurantSettlement.findMany({
        where: {
          restaurantId,
          status: { in: ['PENDING', 'ELIGIBLE'] },
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
      });

      if (pendingSettlements.length === 0) {
        throw new BadRequestException('No pending settlements found for this period.');
      }

      // 2. Calculate total pending
      let totalPending = 0;
      for (const s of pendingSettlements) {
        totalPending += Number(s.netPayable || 0);
      }

      if (totalPending <= 0) {
        throw new BadRequestException('Total payable amount must be greater than zero.');
      }

      // 3. Mark as PAID atomically
      await tx.restaurantSettlement.updateMany({
        where: {
          id: { in: pendingSettlements.map((s) => s.id) },
          status: { in: ['PENDING', 'ELIGIBLE'] }, // concurrency check
        },
        data: {
          status: 'PAID',
          utrNumber: dto.transactionReference || 'MANUAL',
          settledAt: new Date(),
          adminId: adminUserId,
          notes: dto.notes,
        },
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE',
          entityName: 'RestaurantSettlement', entityId: restaurantId, newValue: {
            restaurantId,
            period,
            amount: totalPending,
            settlementIds: pendingSettlements.map(s => s.id),
            method: dto.paymentMethod,
            reference: dto.transactionReference
          },
          ipAddress: '127.0.0.1',
        },
      });

      return { success: true, message: 'Settlement marked as paid.', amount: totalPending };
    });
  }

  async getRiderSettlements(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const drivers = await this.prisma.driver.findMany({
      where: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        vehicles: { take: 1, select: { vehicleNumber: true, vehicleType: true } },
      },
    });
    const settlements = await this.prisma.riderSettlement.findMany({
      where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
    });

    let totalEarnings = 0,
      totalPaid = 0,
      totalPending = 0;
    const summaryMap = new Map();
    for (const d of drivers)
      summaryMap.set(d.id, {
        driver: d,
        completedDeliveries: 0,
        totalEarnings: 0,
        paidAmount: 0,
        pendingAmount: 0,
        settlementStatus: 'PENDING',
      });

    for (const s of settlements) {
      const entry = summaryMap.get(s.driverId);
      if (entry) {
        const net = Number(s.netPayable);
        entry.completedDeliveries++;
        entry.totalEarnings += net;
        if (s.status === 'PAID') {
          entry.paidAmount += net;
          entry.settlementStatus = 'PAID';
        } else {
          entry.pendingAmount += net;
          entry.settlementStatus = 'PENDING';
        }
        totalEarnings += net;
        if (s.status === 'PAID') totalPaid += net;
        else totalPending += net;
      }
    }

    return {
      period,
      summary: { totalEarnings, totalPaid, totalPending, totalActiveRiders: drivers.length },
      data: Array.from(summaryMap.values()),
    };
  }

  async getRiderSettlementDetail(
    driverId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const settlements = await this.prisma.riderSettlement.findMany({
      where: {
        driverId,
        periodStart: { gte: period.periodStart },
        periodEnd: { lte: period.periodEnd },
      },
      include: { order: true },
    });

    let totalEarnings = 0,
      paidAmount = 0,
      pendingAmount = 0;
    const deliveries = settlements.map((s) => {
      const net = Number(s.netPayable);
      totalEarnings += net;
      if (s.status === 'PAID') paidAmount += net;
      else pendingAmount += net;
      return {
        orderId: s.orderId,
        orderNumber: s.order?.orderNumber,
        status: s.status,
        deliveredAt: s.periodStart,
        basePayout: s.basePayoutAmount,
        distancePayout: s.distancePayout,
        bonus: s.bonusAmount,
        totalEarning: net,
      };
    });

    return {
      driverId,
      period,
      financialSummary: {
        deliveryCount: settlements.length,
        totalEarnings,
        paidAmount,
        pendingAmount,
        status: pendingAmount === 0 ? 'PAID' : 'PENDING',
      },
      deliveries,
      history: [],
    };
  }

  async recordRiderPayment(
    driverId: string,
    dto: { amount: number; paymentMethod: string; transactionReference: string; notes?: string },
    adminUserId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    
    return await this.prisma.$transaction(async (tx) => {
      // 1. Find pending settlements
      const pendingSettlements = await tx.riderSettlement.findMany({
        where: {
          driverId,
          status: { in: ['PENDING', 'ELIGIBLE'] },
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
      });

      if (pendingSettlements.length === 0) {
        throw new BadRequestException('No pending settlements found for this period.');
      }

      // 2. Calculate total pending
      let totalPending = 0;
      for (const s of pendingSettlements) {
        totalPending += Number(s.netPayable || 0);
      }

      if (totalPending <= 0) {
        throw new BadRequestException('Total payable amount must be greater than zero.');
      }

      // 3. Mark as PAID atomically
      await tx.riderSettlement.updateMany({
        where: {
          id: { in: pendingSettlements.map((s) => s.id) },
          status: { in: ['PENDING', 'ELIGIBLE'] }, // concurrency check
        },
        data: {
          status: 'PAID',
          utrNumber: dto.transactionReference || 'MANUAL',
          settledAt: new Date(),
          adminId: adminUserId,
          notes: dto.notes,
        },
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE',
          entityName: 'RiderSettlement', entityId: driverId, newValue: {
            driverId,
            period,
            amount: totalPending,
            settlementIds: pendingSettlements.map(s => s.id),
            method: dto.paymentMethod,
            reference: dto.transactionReference
          },
          ipAddress: '127.0.0.1',
        },
      });

      return { success: true, message: 'Rider settlement marked as paid.', amount: totalPending };
    });
  }

  async getUnifiedTransactions(p1?: any, p2?: any, p3?: any) {
    return [];
  }

  async getSettlementHistory(restaurantId: string) {
    const settlements = await this.prisma.restaurantSettlement.findMany({
      where: { restaurantId },
      orderBy: { periodStart: 'desc' },
    });

    const weeks = new Map();
    for (const s of settlements) {
      // Create a weekly key based on the start of the week for s.periodStart
      const date = new Date(s.periodStart);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const startOfWeek = new Date(date.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const key = startOfWeek.toISOString();

      if (!weeks.has(key)) {
        weeks.set(key, {
          id: `batch-${key}`,
          periodStart: startOfWeek.toISOString(),
          periodEnd: endOfWeek.toISOString(),
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netPayable: 0,
          status: 'PAID', // Will be PENDING if any are PENDING
          utrNumber: null,
        });
      }

      const entry = weeks.get(key);
      entry.orderCount++;
      entry.grossAmount += Number(s.grossAmount);
      entry.commissionAmount += Number(s.commissionAmount);
      entry.netPayable += Number(s.netPayable);
      if (s.status === 'PENDING' || s.status === 'ELIGIBLE') {
        entry.status = 'PENDING';
      }
      if (s.utrNumber && !entry.utrNumber) {
        entry.utrNumber = s.utrNumber;
      }
    }

    return Array.from(weeks.values()).sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
  }

  async recordRestaurantManualPayment(restaurantId: string, dto: any, adminUserId: string) {
    return this.recordRestaurantPayment(restaurantId, dto, adminUserId);
  }

  async recordRiderManualPayment(driverId: string, dto: any, adminUserId: string) {
    return this.recordRiderPayment(driverId, dto, adminUserId);
  }

  async getFinancialAuditLogs() {
    return [];
  }

  async getReconciliationReport(p1?: any, p2?: any, p3?: any) {
    return { data: [] };
  }
}





