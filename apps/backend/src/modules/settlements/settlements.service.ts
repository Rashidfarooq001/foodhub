import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
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

/** Generate invoice number like SINV-20260919-A3F2B1 */
function generateInvoiceNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SINV-${datePart}-${randPart}`;
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

    // Load invoices for the period
    const invoices = await this.prisma.settlementInvoice.findMany({
      where: {
        periodStart: { gte: period.periodStart },
        periodEnd: { lte: period.periodEnd },
      },
      select: { restaurantId: true, invoiceNumber: true, paymentDate: true },
    });
    const invoiceMap = new Map<string, { invoiceNumber: string; paymentDate: Date }>();
    for (const inv of invoices) {
      invoiceMap.set(inv.restaurantId, { invoiceNumber: inv.invoiceNumber, paymentDate: inv.paymentDate });
    }

    let totalGmv = 0,
      totalCommission = 0,
      totalRestaurantPayable = 0,
      totalAlreadyPaid = 0,
      totalPendingPayable = 0;

    const summaryMap = new Map<string, {
      restaurant: any;
      orderCount: number;
      grossSales: number;
      commissionAmount: number;
      commissionGst: number;
      commissionTotal: number;
      netPayable: number;
      paidAmount: number;
      pendingAmount: number;
      status: string;
      settledAt: Date | null;
      invoiceNumber: string | null;
      paymentDate: Date | null;
      allPaid: boolean;
      hasRows: boolean;
    }>();

    for (const r of restaurants) {
      summaryMap.set(r.id, {
        restaurant: r,
        orderCount: 0,
        grossSales: 0,
        commissionAmount: 0,
        commissionGst: 0,
        commissionTotal: 0,
        netPayable: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: 'PENDING',
        settledAt: null,
        invoiceNumber: invoiceMap.get(r.id)?.invoiceNumber ?? null,
        paymentDate: invoiceMap.get(r.id)?.paymentDate ?? null,
        allPaid: true,   // will flip to false on first non-PAID row
        hasRows: false,
      });
    }

    for (const s of settlements) {
      const entry = summaryMap.get(s.restaurantId);
      if (!entry) continue;

      const net = Number(s.netPayable);
      entry.hasRows = true;
      entry.orderCount++;
      entry.grossSales += Number(s.grossAmount);
      entry.commissionAmount += Number(s.commissionAmount);
      entry.commissionGst += Number(s.commissionGst);
      entry.commissionTotal += Number(s.commissionTotal);
      entry.netPayable += net;

      if (s.status === 'PAID') {
        entry.paidAmount += net;
        // Track the most recent settledAt
        if (s.settledAt && (!entry.settledAt || s.settledAt > entry.settledAt)) {
          entry.settledAt = s.settledAt;
        }
      } else {
        // Any non-PAID row means not fully settled
        entry.pendingAmount += net;
        entry.allPaid = false;
      }

      totalGmv += Number(s.grossAmount);
      totalCommission += Number(s.commissionAmount);
      totalRestaurantPayable += net;
      if (s.status === 'PAID') totalAlreadyPaid += net;
      else totalPendingPayable += net;
    }

    // Set authoritative status: PAID only when ALL rows are PAID and there is at least one row
    for (const [, entry] of summaryMap) {
      if (entry.hasRows && entry.allPaid) {
        entry.status = 'PAID';
      } else {
        entry.status = 'PENDING';
      }
      // Round financials
      entry.grossSales = Math.round(entry.grossSales * 100) / 100;
      entry.commissionAmount = Math.round(entry.commissionAmount * 100) / 100;
      entry.commissionGst = Math.round(entry.commissionGst * 100) / 100;
      entry.commissionTotal = Math.round(entry.commissionTotal * 100) / 100;
      entry.netPayable = Math.round(entry.netPayable * 100) / 100;
      entry.paidAmount = Math.round(entry.paidAmount * 100) / 100;
      entry.pendingAmount = Math.round(entry.pendingAmount * 100) / 100;
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

    const [settlements, restaurant, invoice] = await Promise.all([
      this.prisma.restaurantSettlement.findMany({
        where: {
          restaurantId,
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
        include: {
          order: {
            include: { customer: { include: { user: { include: { profile: true } } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true, phone: true, email: true, bankAccount: true },
      }),
      this.prisma.settlementInvoice.findFirst({
        where: {
          restaurantId,
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
      }),
    ]);

    let grossSales = 0,
      commissionAmount = 0,
      commissionGst = 0,
      commissionTotal = 0,
      netPayable = 0,
      paidAmount = 0,
      pendingAmount = 0;
    let allPaid = settlements.length > 0;
    let latestSettledAt: Date | null = null;

    const orders = settlements.map((s) => {
      grossSales += Number(s.grossAmount);
      commissionAmount += Number(s.commissionAmount);
      commissionGst += Number(s.commissionGst);
      commissionTotal += Number(s.commissionTotal);
      const net = Number(s.netPayable);
      netPayable += net;

      if (s.status === 'PAID') {
        paidAmount += net;
        if (s.settledAt && (!latestSettledAt || s.settledAt > latestSettledAt)) {
          latestSettledAt = s.settledAt;
        }
      } else {
        pendingAmount += net;
        allPaid = false;
      }

      return {
        orderId: s.orderId,
        orderNumber: s.order?.orderNumber,
        orderDate: s.order?.createdAt ?? null,   // â† ACTUAL order creation date (fixes "N/A")
        status: s.order?.status,
        customerName:
          s.order?.customer?.user?.profile?.firstName
            ? `${s.order.customer.user.profile.firstName} ${s.order.customer.user.profile.lastName || ''}`.trim()
            : 'Customer',
        totalAmount: Number(s.grossAmount),
        commissionAmount: Number(s.commissionAmount),
        commissionGst: Number(s.commissionGst),
        commissionTotal: Number(s.commissionTotal),
        netPayable: Number(s.netPayable),
        settlementStatus: s.status,
      };
    });

    // Sort orders by orderDate DESC (latest first)
    orders.sort((a, b) => {
      const da = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const db = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return db - da;
    });

    const aggregatedStatus = allPaid ? 'PAID' : 'PENDING';

    const weeklySettlement = {
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      periodLabel: period.periodLabel,
      orderCount: settlements.length,
      grossSales: Math.round(grossSales * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      commissionGst: Math.round(commissionGst * 100) / 100,
      commissionTotal: Math.round(commissionTotal * 100) / 100,
      netPayable: Math.round(netPayable * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      status: aggregatedStatus,
      paymentMethod: aggregatedStatus === 'PAID' ? 'MANUAL' : null,
      paymentDate: latestSettledAt,
      invoiceNumber: invoice?.invoiceNumber ?? null,
      invoiceId: invoice?.id ?? null,
      invoiceCreatedAt: invoice?.createdAt ?? null,
    };

    return {
      restaurantId,
      restaurant,
      period,
      weeklySettlement,
      financialSummary: {
        orderCount: settlements.length,
        grossSales: Math.round(grossSales * 100) / 100,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        commissionGst: Math.round(commissionGst * 100) / 100,
        netPayable: Math.round(netPayable * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        status: aggregatedStatus,
        settledAt: latestSettledAt,
      },
      orders,
    };
  }

  async recordRestaurantPayment(
    restaurantId: string,
    dto: {
      amount?: number;
      paymentMethod?: string;
      transactionReference?: string;
      notes?: string;
      periodType?: string;
      customStart?: string;
      customEnd?: string;
    },
    adminUserId: string,
  ) {
    const periodType = dto.periodType || 'current';
    const period = getWeeklyPeriod(periodType, dto.customStart, dto.customEnd);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Find pending settlements within this period
      const pendingSettlements = await tx.restaurantSettlement.findMany({
        where: {
          restaurantId,
          status: { in: ['PENDING', 'ELIGIBLE'] },
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
      });

      if (pendingSettlements.length === 0) {
        // Check if already fully paid
        const anySettlement = await tx.restaurantSettlement.findFirst({
          where: {
            restaurantId,
            periodStart: { gte: period.periodStart },
            periodEnd: { lte: period.periodEnd },
          },
        });
        if (anySettlement) {
          throw new ConflictException(
            'Settlement for this period is already fully paid. No duplicate payment allowed.',
          );
        }
        throw new BadRequestException('No pending settlements found for this period.');
      }

      // 2. Calculate totals from stored authoritative values
      let totalGross = 0,
        totalCommission = 0,
        totalCommissionGst = 0,
        totalCommissionTotal = 0,
        totalPending = 0;

      for (const s of pendingSettlements) {
        totalGross += Number(s.grossAmount || 0);
        totalCommission += Number(s.commissionAmount || 0);
        totalCommissionGst += Number(s.commissionGst || 0);
        totalCommissionTotal += Number(s.commissionTotal || 0);
        totalPending += Number(s.netPayable || 0);
      }

      if (totalPending <= 0) {
        throw new BadRequestException('Total payable amount must be greater than zero.');
      }

      const paymentDate = new Date();

      // 3. Mark settlements as PAID atomically (concurrency-safe: re-check status in WHERE)
      const updated = await tx.restaurantSettlement.updateMany({
        where: {
          id: { in: pendingSettlements.map((s) => s.id) },
          status: { in: ['PENDING', 'ELIGIBLE'] }, // double-check for race condition
        },
        data: {
          status: 'PAID',
          utrNumber: dto.transactionReference || 'MANUAL',
          settledAt: paymentDate,
          adminId: adminUserId,
          notes: dto.notes,
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Settlement was already paid by another process. No duplicate payment created.',
        );
      }

      // 4. Get the earliest periodStart and latest periodEnd for invoice period range
      const minPeriodStart = pendingSettlements.reduce(
        (min, s) => (s.periodStart < min ? s.periodStart : min),
        pendingSettlements[0].periodStart,
      );
      const maxPeriodEnd = pendingSettlements.reduce(
        (max, s) => (s.periodEnd > max ? s.periodEnd : max),
        pendingSettlements[0].periodEnd,
      );

      // 5. Create SettlementInvoice atomically (upsert = idempotent / duplicate-safe)
      // Check if an invoice already exists for this exact restaurant+period
      const existingInvoice = await tx.settlementInvoice.findFirst({
        where: {
          restaurantId,
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
      });

      let invoiceNumber: string;
      if (existingInvoice) {
        // Invoice already exists (should not happen if duplicate check above worked, but be safe)
        invoiceNumber = existingInvoice.invoiceNumber;
      } else {
        invoiceNumber = generateInvoiceNumber();
        await tx.settlementInvoice.create({
          data: {
            invoiceNumber,
            restaurantId,
            periodStart: minPeriodStart,
            periodEnd: maxPeriodEnd,
            grossAmount: Math.round(totalGross * 100) / 100,
            commissionAmount: Math.round(totalCommission * 100) / 100,
            commissionGst: Math.round(totalCommissionGst * 100) / 100,
            commissionTotal: Math.round(totalCommissionTotal * 100) / 100,
            netPayable: Math.round(totalPending * 100) / 100,
            paidAmount: Math.round(totalPending * 100) / 100,
            pendingAmount: 0,
            paymentMethod: dto.paymentMethod || 'MANUAL',
            paymentDate,
            adminId: adminUserId,
            notes: dto.notes,
          },
        });
      }

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE',
          entityName: 'RestaurantSettlement',
          entityId: restaurantId,
          newValue: {
            restaurantId,
            period: { periodStart: period.periodStart, periodEnd: period.periodEnd },
            amount: totalPending,
            settlementIds: pendingSettlements.map((s) => s.id),
            method: dto.paymentMethod || 'MANUAL',
            reference: dto.transactionReference || 'MANUAL',
            invoiceNumber,
          },
          ipAddress: '127.0.0.1',
        },
      });

      return {
        success: true,
        message: 'Settlement marked as paid and invoice generated.',
        amount: Math.round(totalPending * 100) / 100,
        invoiceNumber,
        paymentDate,
      };
    });
  }

  async getRestaurantSettlementInvoice(
    restaurantId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const invoice = await this.prisma.settlementInvoice.findFirst({
      where: {
        restaurantId,
        periodStart: { gte: period.periodStart },
        periodEnd: { lte: period.periodEnd },
      },
      include: {
        restaurant: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('No settlement invoice found for this restaurant and period.');
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      restaurantId: invoice.restaurantId,
      restaurantName: invoice.restaurant?.name,
      restaurantPhone: invoice.restaurant?.phone,
      restaurantEmail: invoice.restaurant?.email,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      grossAmount: Number(invoice.grossAmount),
      commissionAmount: Number(invoice.commissionAmount),
      commissionGst: Number(invoice.commissionGst),
      commissionTotal: Number(invoice.commissionTotal),
      netPayable: Number(invoice.netPayable),
      paidAmount: Number(invoice.paidAmount),
      pendingAmount: Number(invoice.pendingAmount),
      paymentMethod: invoice.paymentMethod,
      paymentDate: invoice.paymentDate,
      createdAt: invoice.createdAt,
    };
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
        status: pendingAmount === 0 && settlements.length > 0 ? 'PAID' : 'PENDING',
      },
      deliveries,
      history: [],
    };
  }

  async recordRiderPayment(
    driverId: string,
    dto: { amount?: number; paymentMethod?: string; transactionReference?: string; notes?: string; periodType?: string; customStart?: string; customEnd?: string },
    adminUserId: string,
  ) {
    const period = getWeeklyPeriod(dto.periodType || 'current', dto.customStart, dto.customEnd);

    return await this.prisma.$transaction(async (tx) => {
      const pendingSettlements = await tx.riderSettlement.findMany({
        where: {
          driverId,
          status: { in: ['PENDING', 'ELIGIBLE'] },
          periodStart: { gte: period.periodStart },
          periodEnd: { lte: period.periodEnd },
        },
      });

      if (pendingSettlements.length === 0) {
        const any = await tx.riderSettlement.findFirst({ where: { driverId, periodStart: { gte: period.periodStart } } });
        if (any) throw new ConflictException('Rider settlement already fully paid.');
        throw new BadRequestException('No pending rider settlements found for this period.');
      }

      let totalPending = 0;
      for (const s of pendingSettlements) totalPending += Number(s.netPayable || 0);
      if (totalPending <= 0) throw new BadRequestException('Total payable amount must be greater than zero.');

      const updated = await tx.riderSettlement.updateMany({
        where: {
          id: { in: pendingSettlements.map((s) => s.id) },
          status: { in: ['PENDING', 'ELIGIBLE'] },
        },
        data: {
          status: 'PAID',
          utrNumber: dto.transactionReference || 'MANUAL',
          settledAt: new Date(),
          adminId: adminUserId,
          notes: dto.notes,
        },
      });

      if (updated.count === 0) throw new ConflictException('Rider settlement was already paid by another process.');

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE',
          entityName: 'RiderSettlement',
          entityId: driverId,
          newValue: { driverId, period, amount: totalPending, settlementIds: pendingSettlements.map((s) => s.id), method: dto.paymentMethod, reference: dto.transactionReference },
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
      const date = new Date(s.periodStart);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
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
          status: 'PAID',
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

    return Array.from(weeks.values()).sort(
      (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime(),
    );
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