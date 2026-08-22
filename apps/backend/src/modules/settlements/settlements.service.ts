import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CommissionService } from './commission.service';
import { SettlementStatus, OrderStatus, PaymentStatus, DeliveryJobStatus, Prisma } from '@prisma/client';
import { OrdersGateway } from '../orders/orders.gateway';
import { ORDER_EVENTS } from '../orders/orders.events';

export interface WeeklyPeriod {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
}

/**
 * Calculates start and end Date objects for various period types in IST time
 */
export function getWeeklyPeriod(
  periodType: string = 'current',
  customStart?: string,
  customEnd?: string,
): WeeklyPeriod {
  const now = new Date();

  if (
    (periodType === 'custom' ||
      !['today', 'current', 'this_week', 'previous', 'previous_week', 'this_month', 'previous_month'].includes(
        periodType,
      )) &&
    customStart &&
    customEnd
  ) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return {
      periodStart: start,
      periodEnd: end,
      periodLabel: `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} → ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    };
  }

  if (periodType === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return {
      periodStart: start,
      periodEnd: end,
      periodLabel: `Today (${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`,
    };
  }

  if (periodType === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      periodStart: start,
      periodEnd: end,
      periodLabel: `This Month (${start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})`,
    };
  }

  if (periodType === 'previous_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return {
      periodStart: start,
      periodEnd: end,
      periodLabel: `Previous Month (${start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})`,
    };
  }

  // Weekly calculations (Monday - Sunday)
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ...
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  if (periodType === 'previous' || periodType === 'previous_week') {
    monday.setDate(monday.getDate() - 7);
  }
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const prefix = periodType === 'previous' || periodType === 'previous_week' ? 'Previous Week' : 'This Week';
  return {
    periodStart: monday,
    periodEnd: sunday,
    periodLabel: `${prefix} (${monday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → ${sunday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`,
  };
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

  /**
   * Authoritative restaurant-by-restaurant weekly settlements summary from PostgreSQL
   */
  async getWeeklyRestaurantSettlements(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    // 1. Fetch all approved/active restaurants with bank accounts & owner info
    const restaurants = await this.prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        ownerId: true,
        commissionRate: true,
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            accountHolder: true,
            ifscCode: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const ownerIds = restaurants.map((r) => r.ownerId).filter(Boolean);
    const ownerUsers =
      this.prisma.user?.findMany && ownerIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: {
              id: true,
              phone: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        : [];
    const ownerMap = new Map(ownerUsers.map((u: any) => [u.id, u]));

    // 2. Fetch delivered + paid orders within the period
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        restaurantId: true,
        totalAmount: true,
        subtotal: true,
        pricingSnapshot: true,
        createdAt: true,
      },
    });

    // 3. Fetch existing settlement records for this period
    let existingSettlements: any[] = [];
    try {
      existingSettlements = await this.prisma.settlement.findMany({
        where: {
          periodStart: { gte: new Date(periodStart.getTime() - 1000), lte: new Date(periodStart.getTime() + 1000) },
          periodEnd: { gte: new Date(periodEnd.getTime() - 1000), lte: new Date(periodEnd.getTime() + 1000) },
        },
      });
    } catch (e: any) {
      this.logger.warn(`Could not load existing settlements: ${e?.message}`);
      existingSettlements = [];
    }

    // 4. Map and calculate totals per restaurant
    const restOrderMap: Record<string, typeof orders> = {};
    for (const ord of orders) {
      if (!restOrderMap[ord.restaurantId]) {
        restOrderMap[ord.restaurantId] = [];
      }
      restOrderMap[ord.restaurantId].push(ord);
    }

    let totalGmv = 0;
    let totalCommission = 0;
    let totalGst = 0;
    let totalPlatformFees = 0;
    let totalRestaurantPayable = 0;
    let totalAlreadyPaid = 0;
    let totalPendingPayable = 0;
    let totalProcessingCount = 0;
    let totalFailedCount = 0;

    const restaurantRows = restaurants.map((r) => {
      const restOrders = restOrderMap[r.id] || [];
      let grossFoodSales = 0;
      let commissionAmount = 0;
      let restaurantGst = 0;
      let restaurantPlatformFees = 0;

      for (const o of restOrders) {
        const snap: any = o.pricingSnapshot || {};
        const foodSubtotal = Number(
          snap.restaurantGross !== undefined && snap.restaurantGross !== null
            ? snap.restaurantGross
            : o.subtotal || o.totalAmount,
        );
        // Order-level commission rate (13% platform rule on each order):
        // 1. Snapshot commissionRate if already calculated on order
        // 2. Restaurant contracted commissionRate from DB
        // 3. Platform default 13.0%
        const commRate =
          snap.commissionRate !== undefined && snap.commissionRate !== null
            ? Number(snap.commissionRate)
            : r.commissionRate !== null && r.commissionRate !== undefined
            ? Number(r.commissionRate)
            : 13.0;

        // Order-level commission amount:
        // 1. Stored snapshot commissionAmount
        // 2. Order commission = foodSubtotal * commRate / 100
        const comm = Number(
          snap.commissionAmount !== undefined && snap.commissionAmount !== null
            ? snap.commissionAmount
            : Math.round(((foodSubtotal * commRate) / 100) * 100) / 100,
        );

        const gst = Number(
          snap.restaurantFoodGst !== undefined && snap.restaurantFoodGst !== null
            ? snap.restaurantFoodGst
            : snap.totalCustomerTaxes !== undefined && snap.totalCustomerTaxes !== null
            ? snap.totalCustomerTaxes
            : 0,
        );
        const platFee = Number(
          snap.platformFee !== undefined && snap.platformFee !== null ? snap.platformFee : 3.0,
        );

        grossFoodSales += foodSubtotal;
        commissionAmount += comm;
        restaurantGst += gst;
        restaurantPlatformFees += platFee;
      }

      const netPayable = Math.max(0, grossFoodSales - commissionAmount);
      const settlementRecord = existingSettlements.find((s) => s.restaurantId === r.id);

      let status: SettlementStatus = SettlementStatus.PENDING;
      let paidAmount = 0;
      let pendingAmount = netPayable;
      let utrNumber: string | null = null;
      let payoutId: string | null = null;
      let settledAt: Date | null = null;
      let failureReason: string | null = null;

      if (settlementRecord) {
        status = settlementRecord.status;
        paidAmount = Number(settlementRecord.paidAmount || 0);
        pendingAmount = Number(
          settlementRecord.pendingAmount !== undefined
            ? settlementRecord.pendingAmount
            : status === SettlementStatus.SETTLED
            ? 0
            : netPayable,
        );
        utrNumber = settlementRecord.utrNumber;
        payoutId = settlementRecord.payoutId;
        settledAt = settlementRecord.settledAt;
        failureReason = settlementRecord.failureReason;
      } else if (netPayable === 0) {
        pendingAmount = 0;
        paidAmount = 0;
        status = SettlementStatus.SETTLED;
      }

      totalGmv += grossFoodSales;
      totalCommission += commissionAmount;
      totalGst += restaurantGst;
      totalPlatformFees += restaurantPlatformFees;
      totalRestaurantPayable += netPayable;
      totalAlreadyPaid += paidAmount;
      totalPendingPayable += pendingAmount;

      if (status === SettlementStatus.PROCESSING) totalProcessingCount++;
      if (status === SettlementStatus.PAYOUT_FAILED) totalFailedCount++;

      // Owner name resolution
      const ownerUser = r.ownerId ? ownerMap.get(r.ownerId) : null;
      const ownerName = ownerUser?.profile
        ? `${ownerUser.profile.firstName} ${ownerUser.profile.lastName || ''}`.trim()
        : 'Merchant Owner';

      // Mask bank account
      const rawAcc = r.bankAccount?.accountNumber;
      const maskedAcc =
        rawAcc && rawAcc.length > 4
          ? `•••• •••• ${rawAcc.slice(-4)}`
          : rawAcc || 'Not Configured';

      return {
        restaurantId: r.id,
        restaurantName: r.name,
        ownerName: ownerName || 'Merchant Owner',
        phone: r.phone || ownerUser?.phone || '',
        email: r.email || ownerUser?.email || '',
        settlementId: settlementRecord?.id || null,
        bankDetails: {
          bankName: r.bankAccount?.bankName || 'Verified Merchant Bank Account',
          accountHolder: r.bankAccount?.accountHolder || r.name,
          accountNumber: maskedAcc,
          ifscCode: r.bankAccount?.ifscCode || 'SBIN0001234',
          isConfigured: Boolean(r.bankAccount?.accountNumber),
        },
        orderCount: restOrders.length,
        grossSales: Math.round(grossFoodSales * 100) / 100,
        commissionRate: r.commissionRate !== null && r.commissionRate !== undefined ? Number(r.commissionRate) : 13.0,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        gstAmount: Math.round(restaurantGst * 100) / 100,
        platformFees: Math.round(restaurantPlatformFees * 100) / 100,
        authorizedDeductions: 0,
        netPayable: Math.round(netPayable * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        status,
        utrNumber,
        payoutId,
        settledAt,
        failureReason,
      };
    });

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      summary: {
        totalRestaurants: restaurants.length,
        totalOrders: orders.length,
        weeklyGmv: Math.round(totalGmv * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
        totalRestaurantPayable: Math.round(totalRestaurantPayable * 100) / 100,
        totalAlreadyPaid: Math.round(totalAlreadyPaid * 100) / 100,
        totalPendingPayable: Math.round(totalPendingPayable * 100) / 100,
        processingCount: totalProcessingCount,
        failedCount: totalFailedCount,
      },
      restaurants: restaurantRows,
    };
  }

  /**
   * Get detailed order breakdown and bank info for a specific restaurant & period
   */
  async getRestaurantSettlementDetail(
    restaurantId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        bankAccount: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }

    let ownerUser: any = null;
    if (restaurant.ownerId) {
      ownerUser = await this.prisma.user.findUnique({
        where: { id: restaurant.ownerId },
        select: {
          id: true,
          phone: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        customer: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let grossFoodSales = 0;
    let totalCommission = 0;
    let totalGst = 0;
    let totalPlatformFees = 0;

    const settlementRecord = await this.prisma.settlement.findFirst({
      where: {
        restaurantId,
        periodStart: { gte: new Date(periodStart.getTime() - 1000), lte: new Date(periodStart.getTime() + 1000) },
        periodEnd: { gte: new Date(periodEnd.getTime() - 1000), lte: new Date(periodEnd.getTime() + 1000) },
      },
    });

    const currentSettlementStatus = settlementRecord
      ? settlementRecord.status
      : SettlementStatus.PENDING;

    const orderRows = orders.map((o) => {
      const snap: any = o.pricingSnapshot || {};
      const foodSubtotal = Number(
        snap.restaurantGross !== undefined && snap.restaurantGross !== null
          ? snap.restaurantGross
          : o.subtotal || o.totalAmount,
      );
      const commRate =
        snap.commissionRate !== undefined && snap.commissionRate !== null
          ? Number(snap.commissionRate)
          : restaurant.commissionRate !== null && restaurant.commissionRate !== undefined
          ? Number(restaurant.commissionRate)
          : 13.0;

      const comm = Number(
        snap.commissionAmount !== undefined && snap.commissionAmount !== null
          ? snap.commissionAmount
          : Math.round(((foodSubtotal * commRate) / 100) * 100) / 100,
      );

      const gst = Number(
        snap.restaurantFoodGst !== undefined && snap.restaurantFoodGst !== null
          ? snap.restaurantFoodGst
          : snap.totalCustomerTaxes !== undefined && snap.totalCustomerTaxes !== null
          ? snap.totalCustomerTaxes
          : 0,
      );
      const platFee = Number(
        snap.platformFee !== undefined && snap.platformFee !== null ? snap.platformFee : 3.0,
      );
      const net = Math.max(0, Math.round((foodSubtotal - comm) * 100) / 100);

      grossFoodSales += foodSubtotal;
      totalCommission += comm;
      totalGst += gst;
      totalPlatformFees += platFee;

      const customerDisplayName = o.customer?.user?.profile
        ? `${o.customer.user.profile.firstName} ${o.customer.user.profile.lastName || ''}`.trim()
        : 'Customer';

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        customerName: customerDisplayName,
        foodSubtotal: Math.round(foodSubtotal * 100) / 100,
        grossAmount: Math.round(foodSubtotal * 100) / 100,
        commissionRate: commRate,
        commissionAmount: Math.round(comm * 100) / 100,
        gstAmount: Math.round(gst * 100) / 100,
        platformFee: Math.round(platFee * 100) / 100,
        restaurantNet: net,
        paymentStatus: o.paymentStatus || 'COMPLETED',
        orderStatus: o.status || 'DELIVERED',
        settlementStatus: currentSettlementStatus,
      };
    });

    const netPayable = Math.max(0, grossFoodSales - totalCommission);

    const status = settlementRecord
      ? settlementRecord.status
      : netPayable === 0
      ? SettlementStatus.SETTLED
      : SettlementStatus.PENDING;
    const paidAmount = Number(settlementRecord?.paidAmount || 0);
    const pendingAmount = Number(
      settlementRecord?.pendingAmount !== undefined
        ? settlementRecord.pendingAmount
        : status === SettlementStatus.SETTLED
        ? 0
        : netPayable,
    );

    const ownerName = ownerUser?.profile
      ? `${ownerUser.profile.firstName} ${ownerUser.profile.lastName || ''}`.trim()
      : 'Merchant Owner';

    const rawAcc = restaurant.bankAccount?.accountNumber;
    const maskedAcc =
      rawAcc && rawAcc.length > 4
        ? `•••• •••• ${rawAcc.slice(-4)}`
        : rawAcc || 'Not Configured';

    const effectiveRestCommRate =
      restaurant.commissionRate !== null && restaurant.commissionRate !== undefined
        ? Number(restaurant.commissionRate)
        : 13.0;

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        ownerName: ownerName || 'Merchant Owner',
        phone: restaurant.phone || ownerUser?.phone || '',
        email: restaurant.email || ownerUser?.email || '',
        commissionRate: effectiveRestCommRate,
      },
      bankAccount: {
        bankName: restaurant.bankAccount?.bankName || 'Verified Merchant Bank Account',
        accountHolder: restaurant.bankAccount?.accountHolder || restaurant.name,
        accountNumber: maskedAcc,
        ifscCode: restaurant.bankAccount?.ifscCode || 'SBIN0001234',
        isConfigured: Boolean(restaurant.bankAccount?.accountNumber),
      },
      financialSummary: {
        orderCount: orders.length,
        grossSales: Math.round(grossFoodSales * 100) / 100,
        commissionRate: effectiveRestCommRate,
        commissionAmount: Math.round(totalCommission * 100) / 100,
        gstAmount: Math.round(totalGst * 100) / 100,
        platformFees: Math.round(totalPlatformFees * 100) / 100,
        authorizedDeductions: 0,
        netPayable: Math.round(netPayable * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        status,
        utrNumber: settlementRecord?.utrNumber || null,
        payoutId: settlementRecord?.payoutId || null,
        settledAt: settlementRecord?.settledAt || null,
        failureReason: settlementRecord?.failureReason || null,
      },
      orders: orderRows,
    };
  }

  /**
   * Record Manual Restaurant Settlement Payment (No automatic transfers)
   * Authoritative server timestamp, double-payment prevention, partial payment support, audit logging.
   */
  async recordRestaurantManualPayment(
    restaurantId: string,
    dto: {
      amount: number;
      paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'OTHER';
      transactionReference: string;
      notes?: string;
      periodType?: string;
      customStart?: string;
      customEnd?: string;
    },
    adminUserId: string,
  ) {
    if (!dto.transactionReference || !dto.transactionReference.trim()) {
      throw new BadRequestException('Transaction reference (UTR / Ref Number) is strictly required.');
    }
    if (!dto.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException('Payment amount must be greater than ₹0.');
    }

    const detail = await this.getRestaurantSettlementDetail(
      restaurantId,
      dto.periodType || 'current',
      dto.customStart,
      dto.customEnd,
    );

    const netPayable = detail.financialSummary.netPayable;
    const currentPaid = detail.financialSummary.paidAmount;
    const pendingAmount = detail.financialSummary.pendingAmount;

    if (pendingAmount <= 0) {
      throw new BadRequestException('This restaurant settlement has already been fully paid.');
    }

    const payAmount = Math.round(Number(dto.amount) * 100) / 100;
    if (payAmount > pendingAmount + 0.01) {
      throw new BadRequestException(
        `Payment amount (₹${payAmount}) exceeds the pending balance (₹${pendingAmount}).`,
      );
    }

    const period = getWeeklyPeriod(dto.periodType || 'current', dto.customStart, dto.customEnd);
    const { periodStart, periodEnd } = period;
    const serverTimestamp = new Date();

    const newPaidAmount = Math.round((currentPaid + payAmount) * 100) / 100;
    const newPendingAmount = Math.max(0, Math.round((netPayable - newPaidAmount) * 100) / 100);
    const newStatus =
      newPendingAmount === 0 ? SettlementStatus.SETTLED : SettlementStatus.PROCESSING;

    // Database transaction: update settlement + create audit log
    const settlement = await this.prisma.$transaction(async (tx) => {
      const rec = await tx.settlement.upsert({
        where: {
          restaurantId_periodStart_periodEnd: {
            restaurantId,
            periodStart,
            periodEnd,
          },
        },
        create: {
          restaurantId,
          periodStart,
          periodEnd,
          orderCount: detail.financialSummary.orderCount,
          grossAmount: detail.financialSummary.grossSales,
          commissionRate: detail.restaurant.commissionRate,
          commissionAmount: detail.financialSummary.commissionAmount,
          netPayable,
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          status: newStatus,
          utrNumber: dto.transactionReference.trim(),
          settledAt: serverTimestamp,
          adminId: adminUserId,
          notes: dto.notes?.trim() || null,
        },
        update: {
          orderCount: detail.financialSummary.orderCount,
          grossAmount: detail.financialSummary.grossSales,
          commissionAmount: detail.financialSummary.commissionAmount,
          netPayable,
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          status: newStatus,
          utrNumber: dto.transactionReference.trim(),
          settledAt: serverTimestamp,
          adminId: adminUserId,
          notes: dto.notes?.trim() || null,
        },
      });

      if (tx.auditLog?.create) {
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'UPDATE',
            entityName: 'RestaurantSettlement',
            entityId: rec.id,
            oldValue: {
              previousStatus: detail.financialSummary.status,
              previousPaid: currentPaid,
              previousPending: pendingAmount,
            },
            newValue: {
              restaurantId,
              restaurantName: detail.restaurant.name,
              recordedAmount: payAmount,
              paymentMethod: dto.paymentMethod,
              transactionReference: dto.transactionReference.trim(),
              newPaidAmount,
              newPendingAmount,
              newStatus,
              serverTimestamp: serverTimestamp.toISOString(),
              notes: dto.notes?.trim() || null,
            },
          },
        });
      }

      return rec;
    });

    // Realtime notification
    if (this.gateway) {
      this.gateway.emitToAdmin(ORDER_EVENTS.STATUS_UPDATED, {
        type: 'settlement.manual_paid',
        settlementId: settlement.id,
        restaurantId,
        amount: payAmount,
        status: newStatus,
      });
      this.gateway.emitToRestaurant(restaurantId, ORDER_EVENTS.STATUS_UPDATED, {
        type: 'settlement.manual_paid',
        settlementId: settlement.id,
        amount: payAmount,
        status: newStatus,
      });
    }

    return {
      success: true,
      message:
        newStatus === SettlementStatus.SETTLED
          ? `Settlement of ₹${payAmount} recorded successfully (Fully Settled).`
          : `Partial settlement of ₹${payAmount} recorded successfully (₹${newPendingAmount} remaining).`,
      settlement,
    };
  }

  /**
   * Alias for backward compatibility with initiateRestaurantPayout
   */
  async initiateRestaurantPayout(
    restaurantId: string,
    dto: any,
    adminUserId: string,
  ) {
    return this.recordRestaurantManualPayment(
      restaurantId,
      {
        amount: dto.amount || 0,
        paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
        transactionReference: dto.transactionReference || dto.utrNumber || `MANUAL-${Date.now()}`,
        notes: dto.notes,
        periodType: dto.periodType,
        customStart: dto.customStart,
        customEnd: dto.customEnd,
      },
      adminUserId,
    );
  }

  /**
   * Authoritative Rider Settlements Summary
   */
  async getRiderSettlements(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    // Fetch approved drivers
    const drivers = await this.prisma.driver.findMany({
      where: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        vehicles: {
          take: 1,
          select: { vehicleNumber: true, vehicleType: true },
        },
        driverWallet: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch delivered jobs in period
    const deliveryJobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: DeliveryJobStatus.DELIVERED,
        deliveredAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        driverId: true,
        riderPayout: true,
        deliveryFee: true,
        distanceKm: true,
        deliveredAt: true,
      },
    });

    // Fetch manual payment audit logs for riders in this period
    const manualPaymentLogs = (await this.prisma.auditLog?.findMany?.({
      where: {
        entityName: 'RiderSettlement',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { createdAt: 'desc' },
    })) || [];

    let totalRidersEarnings = 0;
    let totalRidersPaid = 0;
    let totalRidersPending = 0;

    const riderRows = drivers.map((d) => {
      const riderJobs = deliveryJobs.filter((j) => j.driverId === d.id);
      const totalEarned = riderJobs.reduce((sum, j) => {
        const payout = Number(j.riderPayout || 0);
        return sum + (payout > 0 ? payout : 40.0);
      }, 0);

      // Find recorded payments from audit logs or wallet
      const driverLogs = manualPaymentLogs.filter((l: any) => l.entityId === d.id);
      const paid = driverLogs.reduce((sum: number, l: any) => {
        const val = l.newValue as any;
        return sum + (val?.recordedAmount ? Number(val.recordedAmount) : 0);
      }, 0);

      const pending = Math.max(0, Math.round((totalEarned - paid) * 100) / 100);
      const status =
        totalEarned === 0
          ? 'SETTLED'
          : pending === 0
          ? 'SETTLED'
          : paid > 0
          ? 'PROCESSING'
          : 'PENDING';

      totalRidersEarnings += totalEarned;
      totalRidersPaid += paid;
      totalRidersPending += pending;

      const driverName = d.user?.profile
        ? `${d.user.profile.firstName} ${d.user.profile.lastName || ''}`.trim()
        : 'Delivery Partner';

      const lastLog = driverLogs[0] as any;

      return {
        driverId: d.id,
        driverName: driverName || 'Delivery Partner',
        phone: d.user?.phone || '',
        email: d.user?.email || '',
        vehicleNumber: d.vehicles[0]?.vehicleNumber || 'Registered Vehicle',
        vehicleType: d.vehicles[0]?.vehicleType || 'SCOOTER',
        status: d.status,
        completedDeliveries: riderJobs.length,
        totalEarnings: Math.round(totalEarned * 100) / 100,
        paidAmount: Math.round(paid * 100) / 100,
        pendingAmount: pending,
        settlementStatus: status,
        lastSettlementDate: lastLog?.createdAt ? new Date(lastLog.createdAt).toISOString() : null,
        lastUtrNumber: (lastLog?.newValue as any)?.transactionReference || null,
      };
    });

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      summary: {
        totalRiders: drivers.length,
        totalDeliveries: deliveryJobs.length,
        totalEarnings: Math.round(totalRidersEarnings * 100) / 100,
        totalPaid: Math.round(totalRidersPaid * 100) / 100,
        totalPending: Math.round(totalRidersPending * 100) / 100,
      },
      riders: riderRows,
    };
  }

  /**
   * Authoritative Rider Settlement Detail View
   */
  async getRiderSettlementDetail(
    driverId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        vehicles: true,
        driverWallet: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Delivery Partner ${driverId} not found`);
    }

    const deliveryJobs = await this.prisma.deliveryJob.findMany({
      where: {
        driverId,
        status: DeliveryJobStatus.DELIVERED,
        deliveredAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: {
                user: {
                  select: {
                    profile: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    // Historical payment logs for this driver
    const paymentLogs = (await this.prisma.auditLog?.findMany?.({
      where: {
        entityName: 'RiderSettlement',
        entityId: driverId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })) || [];

    const deliveries = deliveryJobs.map((j) => {
      const payout = Number(j.riderPayout || 0);
      const baseEarning = payout > 0 ? 25.0 : 25.0;
      const distanceEarning = payout > 0 ? Math.max(0, payout - 25.0) : 15.0;
      const incentive = 0.0;
      const total = baseEarning + distanceEarning + incentive;

      const customerName = j.order?.customer?.user?.profile
        ? `${j.order.customer.user.profile.firstName} ${j.order.customer.user.profile.lastName || ''}`.trim()
        : 'Customer';

      return {
        jobId: j.id,
        orderId: j.orderId,
        orderNumber: j.order?.orderNumber || 'FH-ORD',
        deliveredAt: j.deliveredAt,
        customerName,
        distanceKm: j.distanceKm || 2.5,
        baseEarning,
        distanceEarning,
        incentive,
        totalEarning: Math.round(total * 100) / 100,
        settlementStatus: 'PENDING',
      };
    });

    const totalEarned = deliveries.reduce((sum, d) => sum + d.totalEarning, 0);
    const paidAmount = paymentLogs.reduce((sum: number, l: any) => {
      const val = l.newValue as any;
      return sum + (val?.recordedAmount ? Number(val.recordedAmount) : 0);
    }, 0);

    const pendingAmount = Math.max(0, Math.round((totalEarned - paidAmount) * 100) / 100);
    const status =
      totalEarned === 0
        ? 'SETTLED'
        : pendingAmount === 0
        ? 'SETTLED'
        : paidAmount > 0
        ? 'PROCESSING'
        : 'PENDING';

    const driverName = driver.user?.profile
      ? `${driver.user.profile.firstName} ${driver.user.profile.lastName || ''}`.trim()
      : 'Delivery Partner';

    const history = paymentLogs.map((l: any) => {
      const val = l.newValue as any;
      const adminName = l.user?.profile
        ? `${l.user.profile.firstName} ${l.user.profile.lastName || ''}`.trim()
        : 'Finance Admin';

      return {
        id: l.id,
        amount: val?.recordedAmount || 0,
        paymentMethod: val?.paymentMethod || 'BANK_TRANSFER',
        transactionReference: val?.transactionReference || 'REF',
        notes: val?.notes || null,
        processedBy: adminName,
        processedAt: l.createdAt,
      };
    });

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      driver: {
        id: driver.id,
        name: driverName || 'Delivery Partner',
        phone: driver.user?.phone || '',
        email: driver.user?.email || '',
        licenseNumber: driver.licenseNumber,
        vehicleNumber: driver.vehicles[0]?.vehicleNumber || 'Registered Vehicle',
        vehicleType: driver.vehicles[0]?.vehicleType || 'SCOOTER',
        status: driver.status,
      },
      financialSummary: {
        deliveryCount: deliveries.length,
        totalEarnings: Math.round(totalEarned * 100) / 100,
        paidAmount: Math.round(paidAmount * 100) / 100,
        pendingAmount,
        status,
      },
      deliveries,
      history,
    };
  }

  /**
   * Record Manual Rider Settlement Payment
   */
  async recordRiderManualPayment(
    driverId: string,
    dto: {
      amount: number;
      paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'OTHER';
      transactionReference: string;
      notes?: string;
      periodType?: string;
      customStart?: string;
      customEnd?: string;
    },
    adminUserId: string,
  ) {
    if (!dto.transactionReference || !dto.transactionReference.trim()) {
      throw new BadRequestException('Transaction reference (UTR / Ref Number) is strictly required.');
    }
    if (!dto.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException('Payment amount must be greater than ₹0.');
    }

    const detail = await this.getRiderSettlementDetail(
      driverId,
      dto.periodType || 'current',
      dto.customStart,
      dto.customEnd,
    );

    const pendingAmount = detail.financialSummary.pendingAmount;
    if (pendingAmount <= 0) {
      throw new BadRequestException('This rider settlement has already been fully paid.');
    }

    const payAmount = Math.round(Number(dto.amount) * 100) / 100;
    if (payAmount > pendingAmount + 0.01) {
      throw new BadRequestException(
        `Payment amount (₹${payAmount}) exceeds the pending balance (₹${pendingAmount}).`,
      );
    }

    const serverTimestamp = new Date();

    if (this.prisma.auditLog?.create) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'UPDATE',
          entityName: 'RiderSettlement',
          entityId: driverId,
          newValue: {
            driverId,
            driverName: detail.driver.name,
            recordedAmount: payAmount,
            paymentMethod: dto.paymentMethod,
            transactionReference: dto.transactionReference.trim(),
            serverTimestamp: serverTimestamp.toISOString(),
            notes: dto.notes?.trim() || null,
          },
        },
      });
    }

    return {
      success: true,
      message: `Manual rider settlement of ₹${payAmount} recorded successfully.`,
    };
  }

  /**
   * Unified Finance Overview (Single Source of Truth)
   */
  async getFinanceOverview(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const [restaurantSettlements, riderSettlements] = await Promise.all([
      this.getWeeklyRestaurantSettlements(periodType, customStart, customEnd),
      this.getRiderSettlements(periodType, customStart, customEnd),
    ]);

    const restSum = restaurantSettlements.summary;
    const riderSum = riderSettlements.summary;

    const totalGrossSales = restSum.weeklyGmv || 0;
    const totalRestaurantPayable = restSum.totalRestaurantPayable || 0;
    const totalRiderPayable = riderSum.totalEarnings || 0;
    const totalCommission = restSum.totalCommission || 0;
    const totalPlatformRevenue = totalCommission + restSum.totalOrders * 3.0;

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      overview: {
        orderCount: restSum.totalOrders || 0,
        grossSales: Math.round(totalGrossSales * 100) / 100,
        restaurantPayable: Math.round(totalRestaurantPayable * 100) / 100,
        riderPayable: Math.round(totalRiderPayable * 100) / 100,
        zaykaRevenue: Math.round(totalPlatformRevenue * 100) / 100,
        pendingRestaurantSettlements: Math.round((restSum.totalPendingPayable || 0) * 100) / 100,
        pendingRiderSettlements: Math.round((riderSum.totalPending || 0) * 100) / 100,
        paidRestaurantSettlements: Math.round((restSum.totalAlreadyPaid || 0) * 100) / 100,
        paidRiderSettlements: Math.round((riderSum.totalPaid || 0) * 100) / 100,
        failedSettlements: restSum.failedCount || 0,
      },
    };
  }

  /**
   * Unified Transaction Ledger
   */
  async getUnifiedTransactions(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            restaurant: { select: { name: true } },
            customer: {
              select: {
                user: {
                  select: { profile: { select: { firstName: true, lastName: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const manualLogs = (await this.prisma.auditLog?.findMany?.({
      where: {
        entityName: { in: ['RestaurantSettlement', 'RiderSettlement'] },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        user: { select: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })) || [];

    const transactions: any[] = [];

    // Customer Inflows
    for (const p of payments) {
      const custName = p.order?.customer?.user?.profile
        ? `${p.order.customer.user.profile.firstName} ${p.order.customer.user.profile.lastName || ''}`.trim()
        : 'Customer';

      transactions.push({
        id: p.id,
        date: p.createdAt,
        type: 'CUSTOMER_PAYMENT',
        orderNumber: p.order?.orderNumber || 'ORD',
        recipientOrPayer: custName,
        amount: Number(p.amount),
        direction: 'INFLOW',
        status: p.status,
        reference: p.razorpayPaymentId || p.razorpayOrderId || 'DIRECT',
        processedBy: 'Customer Gateway',
      });
    }

    // Manual Settlement Outflows
    for (const l of manualLogs) {
      const val = l.newValue as any;
      const adminName = l.user?.profile
        ? `${l.user.profile.firstName} ${l.user.profile.lastName || ''}`.trim()
        : 'Finance Admin';

      const isRest = l.entityName === 'RestaurantSettlement';
      transactions.push({
        id: l.id,
        date: l.createdAt,
        type: isRest ? 'RESTAURANT_SETTLEMENT' : 'RIDER_SETTLEMENT',
        orderNumber: isRest ? (val?.restaurantName || 'Restaurant') : (val?.driverName || 'Rider'),
        recipientOrPayer: isRest ? (val?.restaurantName || 'Restaurant') : (val?.driverName || 'Rider'),
        amount: Number(val?.recordedAmount || 0),
        direction: 'OUTFLOW',
        status: 'PAID',
        reference: val?.transactionReference || 'MANUAL_REF',
        processedBy: adminName,
      });
    }

    // Sort chronologically desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      total: transactions.length,
      transactions,
    };
  }

  /**
   * Financial Audit Logs
   */
  async getFinancialAuditLogs() {
    const logs = (await this.prisma.auditLog?.findMany?.({
      where: {
        entityName: { in: ['RestaurantSettlement', 'RiderSettlement', 'SETTLEMENT', 'FINANCE'] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })) || [];

    return logs.map((l: any) => {
      const adminName = l.user?.profile
        ? `${l.user.profile.firstName} ${l.user.profile.lastName || ''}`.trim()
        : l.user?.email || 'Admin';

      const val = l.newValue as any;
      return {
        id: l.id,
        adminId: l.userId,
        adminName,
        entityName: l.entityName,
        entityId: l.entityId,
        action: l.action,
        recipient: val?.restaurantName || val?.driverName || 'Vendor',
        amount: val?.recordedAmount || val?.amount || 0,
        paymentMethod: val?.paymentMethod || 'BANK_TRANSFER',
        transactionReference: val?.transactionReference || 'N/A',
        notes: val?.notes || null,
        previousStatus: (l.oldValue as any)?.previousStatus || 'PENDING',
        newStatus: val?.newStatus || 'PAID',
        createdAt: l.createdAt,
      };
    });
  }

  /**
   * Historical settlements for a specific restaurant
   */
  async getSettlementHistory(restaurantId: string) {
    return this.prisma.settlement.findMany({
      where: { restaurantId },
      orderBy: { periodStart: 'desc' },
      take: 52,
    });
  }

  /**
   * Double-entry mathematical reconciliation audit
   */
  async getReconciliationReport(
    periodType: 'current' | 'previous' | 'custom' = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        restaurant: true,
        payments: true,
        deliveryJob: true,
      },
    });

    let totalCustomerCollections = 0;
    let totalRestaurantPayable = 0;
    let totalCommission = 0;
    let totalPlatformFees = 0;
    let totalDeliveryRevenue = 0;
    let totalStatutoryGst = 0;
    let totalRiderPayouts = 0;

    const discrepancies: any[] = [];

    for (const o of orders) {
      const snap: any = o.pricingSnapshot || {};
      const customerPaid = Number(o.totalAmount || 0);
      const foodSubtotal = Number(
        snap.restaurantGross !== undefined ? snap.restaurantGross : o.subtotal || o.totalAmount,
      );
      const commRate =
        snap.commissionRate !== undefined && snap.commissionRate !== null
          ? Number(snap.commissionRate)
          : o.restaurant.commissionRate !== null
          ? Number(o.restaurant.commissionRate)
          : 0;
      const comm = Number(
        snap.commissionAmount !== undefined
          ? snap.commissionAmount
          : (foodSubtotal * commRate) / 100,
      );
      const restNet = Math.max(0, foodSubtotal - comm);
      const platFee = Number(snap.platformFee ?? 3.0);
      const delivFee = Number((snap.customerDeliveryFee ?? o.deliveryFee) || 15);
      const gst = Number(o.taxAmount || 0);
      const riderPay = Number(snap.riderPayout || o.deliveryJob?.riderPayout || 0);

      totalCustomerCollections += customerPaid;
      totalRestaurantPayable += restNet;
      totalCommission += comm;
      totalPlatformFees += platFee;
      totalDeliveryRevenue += delivFee;
      totalStatutoryGst += gst;
      totalRiderPayouts += riderPay;

      const reconstructed = restNet + comm + platFee + delivFee + gst;
      const diff = Math.abs(customerPaid - reconstructed);
      if (diff > 0.05) {
        discrepancies.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          customerPaid,
          reconstructed,
          discrepancy: Math.round(diff * 100) / 100,
        });
      }
    }

    const reconstructedTotal =
      totalRestaurantPayable +
      totalCommission +
      totalPlatformFees +
      totalDeliveryRevenue +
      totalStatutoryGst;
    const totalDiscrepancy =
      Math.round(Math.abs(totalCustomerCollections - reconstructedTotal) * 100) / 100;
    const isBalanced = totalDiscrepancy < 0.05 && discrepancies.length === 0;

    return {
      period: {
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
      orderCount: orders.length,
      equation: {
        customerCollections: Math.round(totalCustomerCollections * 100) / 100,
        restaurantPayable: Math.round(totalRestaurantPayable * 100) / 100,
        restaurantCommission: Math.round(totalCommission * 100) / 100,
        platformFee: Math.round(totalPlatformFees * 100) / 100,
        deliveryRevenue: Math.round(totalDeliveryRevenue * 100) / 100,
        statutoryGst: Math.round(totalStatutoryGst * 100) / 100,
        riderPayoutLiability: Math.round(totalRiderPayouts * 100) / 100,
        reconstructedTotal: Math.round(reconstructedTotal * 100) / 100,
      },
      status: isBalanced ? 'BALANCED' : 'MISMATCH',
      discrepancyAmount: totalDiscrepancy,
      discrepancyOrders: discrepancies,
    };
  }
}
