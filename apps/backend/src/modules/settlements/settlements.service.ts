import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CommissionService } from "./commission.service";
import { OrdersGateway } from "../orders/orders.gateway";

function getWeeklyPeriod(type = "current", customStart?: string, customEnd?: string) {
  const now = new Date();
  if (type === "custom" && customStart && customEnd) {
    return { periodStart: new Date(customStart), periodEnd: new Date(customEnd), periodLabel: "Custom Range" };
  }
  const day = now.getDay() || 7;
  if (type === "last") {
    now.setDate(now.getDate() - 7);
  }
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - day + 1);
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 6);
  periodEnd.setHours(23, 59, 59, 999);

  return { periodStart, periodEnd, periodLabel: `${periodStart.toDateString()} - ${periodEnd.toDateString()}` };
}

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);
  constructor(private readonly prisma: PrismaService, private readonly commission: CommissionService, private readonly gateway?: OrdersGateway) {}

  async verifyRestaurantOwner(restaurantId: string, userId: string): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, ownerId: userId }, select: { id: true } });
    if (restaurant) return true;
    const staff = await this.prisma.restaurantStaff.findFirst({ where: { restaurantId, userId }, select: { id: true } });
    return !!staff;
  }

  async getFinanceOverview(periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const [restSettlements, riderSettlements, orders] = await Promise.all([
      this.prisma.restaurantSettlement.findMany({ where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } } }),
      this.prisma.riderSettlement.findMany({ where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } } }),
      this.prisma.order.findMany({ where: { status: "DELIVERED", createdAt: { gte: period.periodStart, lte: period.periodEnd } }, select: { pricingSnapshot: true } })
    ]);

    let totalGrossSales = 0, totalRestaurantPayable = 0, pendingRestaurantSettlements = 0, paidRestaurantSettlements = 0, failedSettlements = 0, totalCommission = 0;
    for (const s of restSettlements) {
      totalGrossSales += Number(s.grossAmount);
      totalRestaurantPayable += Number(s.netPayable);
      totalCommission += Number(s.commissionAmount);
      if (s.status === "PAID") paidRestaurantSettlements += Number(s.netPayable);
      else if (s.status === "FAILED") failedSettlements++;
      else pendingRestaurantSettlements += Number(s.netPayable);
    }

    let totalRiderPayable = 0, pendingRiderSettlements = 0, paidRiderSettlements = 0;
    for (const s of riderSettlements) {
      const net = Number(s.netPayable);
      totalRiderPayable += net;
      if (s.status === "PAID") paidRiderSettlements += net;
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

  async getWeeklyRestaurantSettlements(periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const restaurants = await this.prisma.restaurant.findMany({ select: { id: true, name: true, phone: true, email: true, status: true, bankAccount: true } });
    const settlements = await this.prisma.restaurantSettlement.findMany({ where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } } });

    let totalGmv = 0, totalCommission = 0, totalRestaurantPayable = 0, totalAlreadyPaid = 0, totalPendingPayable = 0;
    const summaryMap = new Map();
    for (const r of restaurants) summaryMap.set(r.id, { restaurant: r, orderCount: 0, grossSales: 0, commissionAmount: 0, netPayable: 0, paidAmount: 0, pendingAmount: 0, status: "PENDING" });

    for (const s of settlements) {
      const entry = summaryMap.get(s.restaurantId);
      if (entry) {
        const net = Number(s.netPayable);
        entry.orderCount++;
        entry.grossSales += Number(s.grossAmount);
        entry.commissionAmount += Number(s.commissionAmount);
        entry.netPayable += net;
        if (s.status === "PAID") { entry.paidAmount += net; entry.status = "PAID"; } else { entry.pendingAmount += net; entry.status = "PENDING"; }
        totalGmv += Number(s.grossAmount);
        totalCommission += Number(s.commissionAmount);
        totalRestaurantPayable += net;
        if (s.status === "PAID") totalAlreadyPaid += net;
        else totalPendingPayable += net;
      }
    }

    return {
      period,
      summary: { totalOrders: settlements.length, weeklyGmv: totalGmv, totalCommission, totalRestaurantPayable, totalAlreadyPaid, totalPendingPayable, failedCount: 0 },
      data: Array.from(summaryMap.values()),
    };
  }

  async getRestaurantSettlementDetail(restaurantId: string, periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const settlements = await this.prisma.restaurantSettlement.findMany({
      where: { restaurantId, periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
      include: { order: true }
    });

    let grossSales = 0, commissionAmount = 0, netPayable = 0, paidAmount = 0, pendingAmount = 0;
    const orders = settlements.map(s => {
      grossSales += Number(s.grossAmount);
      commissionAmount += Number(s.commissionAmount);
      netPayable += Number(s.netPayable);
      if (s.status === "PAID") paidAmount += Number(s.netPayable);
      else pendingAmount += Number(s.netPayable);
      return { orderId: s.orderId, orderNumber: s.order?.orderNumber, status: s.order?.status, deliveredAt: s.periodStart, totalAmount: s.grossAmount, commissionAmount: s.commissionAmount, netPayable: s.netPayable };
    });

    return { restaurantId, period, financialSummary: { orderCount: settlements.length, grossSales, commissionAmount, netPayable, paidAmount, pendingAmount, status: pendingAmount === 0 ? "PAID" : "PENDING" }, orders };
  }

  async recordRestaurantPayment(restaurantId: string, dto: { amount: number; paymentMethod: string; transactionReference: string; notes?: string }, adminUserId: string, periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    await this.prisma.restaurantSettlement.updateMany({
      where: { restaurantId, status: "PENDING", periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
      data: { status: "PAID", utrNumber: dto.transactionReference, settledAt: new Date(), adminId: adminUserId, notes: dto.notes }
    });
    return { success: true, message: "Settlement marked as paid." };
  }

  async getRiderSettlements(periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const drivers = await this.prisma.driver.findMany({ where: { isApproved: true }, include: { user: { select: { id: true, phone: true, email: true, profile: { select: { firstName: true, lastName: true } } } }, vehicles: { take: 1, select: { vehicleNumber: true, vehicleType: true } } } });
    const settlements = await this.prisma.riderSettlement.findMany({ where: { periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } } });

    let totalEarnings = 0, totalPaid = 0, totalPending = 0;
    const summaryMap = new Map();
    for (const d of drivers) summaryMap.set(d.id, { driver: d, completedDeliveries: 0, totalEarnings: 0, paidAmount: 0, pendingAmount: 0, settlementStatus: "PENDING" });

    for (const s of settlements) {
      const entry = summaryMap.get(s.driverId);
      if (entry) {
        const net = Number(s.netPayable);
        entry.completedDeliveries++;
        entry.totalEarnings += net;
        if (s.status === "PAID") { entry.paidAmount += net; entry.settlementStatus = "PAID"; } else { entry.pendingAmount += net; entry.settlementStatus = "PENDING"; }
        totalEarnings += net;
        if (s.status === "PAID") totalPaid += net;
        else totalPending += net;
      }
    }

    return { period, summary: { totalEarnings, totalPaid, totalPending, totalActiveRiders: drivers.length }, data: Array.from(summaryMap.values()) };
  }

  async getRiderSettlementDetail(driverId: string, periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const settlements = await this.prisma.riderSettlement.findMany({ where: { driverId, periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } }, include: { order: true } });

    let totalEarnings = 0, paidAmount = 0, pendingAmount = 0;
    const deliveries = settlements.map(s => {
      const net = Number(s.netPayable);
      totalEarnings += net;
      if (s.status === "PAID") paidAmount += net;
      else pendingAmount += net;
      return { orderId: s.orderId, orderNumber: s.order?.orderNumber, status: s.status, deliveredAt: s.periodStart, basePayout: s.basePayoutAmount, distancePayout: s.distancePayout, bonus: s.bonusAmount, totalEarning: net };
    });

    return { driverId, period, financialSummary: { deliveryCount: settlements.length, totalEarnings, paidAmount, pendingAmount, status: pendingAmount === 0 ? "PAID" : "PENDING" }, deliveries, history: [] };
  }

  async recordRiderPayment(driverId: string, dto: { amount: number; paymentMethod: string; transactionReference: string; notes?: string }, adminUserId: string, periodType: string = "current", customStart?: string, customEnd?: string) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    await this.prisma.riderSettlement.updateMany({
      where: { driverId, status: "PENDING", periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
      data: { status: "PAID", utrNumber: dto.transactionReference, settledAt: new Date(), adminId: adminUserId, notes: dto.notes }
    });
    return { success: true, message: "Rider settlement marked as paid." };
  }

  async getUnifiedTransactions(p1?: any, p2?: any, p3?: any) { return []; }

  async getSettlementHistory(restaurantId: string) {
    return this.prisma.restaurantSettlement.findMany({ where: { restaurantId }, orderBy: { periodStart: 'desc' } });
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
