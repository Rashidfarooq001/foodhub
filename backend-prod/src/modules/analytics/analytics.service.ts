import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function formatCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ];
  return lines.join('\n');
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────

  async getAdminDashboard(range: string = '7D') {
    let days = 7;
    if (range === '30D') days = 30;
    else if (range === '90D') days = 90;
    else if (range === '1Y') days = 365;

    const startDate = daysAgo(days);
    const today = startOfDay(new Date());
    const yesterday = daysAgo(1);

    // 1. Fetch Orders within period and today/yesterday for growth calculation
    const [
      periodOrders,
      todayOrders,
      yesterdayOrders,
      activeCustomers,
      activeRestaurants,
      approvedDrivers,
      onlineDrivers,
      pendingRestaurantsCount,
      pendingDriversCount,
      pendingSettlementsCount,
      refundTotalAgg,
      categories,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          status: true,
          subtotal: true,
          packagingFee: true,
          deliveryFee: true,
          taxAmount: true,
          totalAmount: true,
          paymentStatus: true,
          pricingSnapshot: true,
          createdAt: true,
          deliveryJob: {
            select: { riderPayout: true },
          },
          orderItems: {
            select: {
              quantity: true,
              totalPrice: true,
              foodItem: {
                select: {
                  categoryId: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: today } },
        select: {
          totalAmount: true,
          paymentStatus: true,
          pricingSnapshot: true,
        },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: yesterday, lt: today } },
        select: {
          totalAmount: true,
          paymentStatus: true,
        },
      }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.restaurant.count({ where: { status: 'APPROVED', deletedAt: null } }),
      this.prisma.driver.count({ where: { isApproved: true, deletedAt: null } }),
      this.prisma.driver.count({ where: { isApproved: true, status: 'ONLINE', deletedAt: null } }),
      this.prisma.restaurant.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } }),
      this.prisma.driver.count({ where: { isApproved: false, deletedAt: null } }),
      this.prisma.order.count({
        where: { status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.COMPLETED },
      }),
      this.prisma.paymentRefund.aggregate({ _sum: { amount: true } }),
      this.prisma.category.findMany({ select: { id: true, name: true } }),
    ]);

    // 2. Financial Aggregations across period
    let grossCustomerCollections = 0;
    let completedOrdersCount = 0;
    let pendingOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let totalPlatformCommission = 0;
    let totalPlatformFees = 0;
    let totalDeliveryFees = 0;
    let totalRiderCosts = 0;
    let totalTaxCollected = 0;

    for (const ord of periodOrders) {
      if (ord.status === OrderStatus.DELIVERED || ord.paymentStatus === PaymentStatus.COMPLETED) {
        grossCustomerCollections += Number(ord.subtotal || 0);
        completedOrdersCount++;
        totalDeliveryFees += Number(ord.deliveryFee || 0);
        totalTaxCollected += Number(ord.taxAmount || 0);

        const snap: any = ord.pricingSnapshot || {};
        totalPlatformCommission += Number(snap.commissionAmount || 0);
        totalPlatformFees += Number(snap.platformFee ?? 3.0);

        if (ord.deliveryJob?.riderPayout) {
          totalRiderCosts += Number(ord.deliveryJob.riderPayout);
        }
      } else if (ord.status === OrderStatus.CANCELLED) {
        cancelledOrdersCount++;
      } else {
        pendingOrdersCount++;
      }
    }

    // 3. Today & Growth Calculations
    const todayCompleted = todayOrders.filter((o) => o.paymentStatus === PaymentStatus.COMPLETED);
    const yesterdayCompleted = yesterdayOrders.filter(
      (o) => o.paymentStatus === PaymentStatus.COMPLETED,
    );

    const todayRevenue = await this.prisma.restaurantSettlement.aggregate({ where: { periodStart: { gte: today } }, _sum: { grossAmount: true } }).then(res => Number(res._sum.grossAmount || 0));
    const yesterdayRevenue = await this.prisma.restaurantSettlement.aggregate({ where: { periodStart: { gte: yesterday, lt: today } }, _sum: { grossAmount: true } }).then(res => Number(res._sum.grossAmount || 0));

    const todayRevenueGrowth =
      yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000) / 10
        : 0;

    const todayOrdersCount = todayOrders.length;
    const yesterdayOrdersCount = yesterdayOrders.length;
    const todayOrdersGrowth =
      yesterdayOrdersCount > 0
        ? Math.round(((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 1000) / 10
        : 0;

    // FoodHub Net Operating Revenue = Commission + Platform Fees
    const foodhubNetRevenue = Math.round((totalPlatformCommission + totalPlatformFees) * 100) / 100;
    const platformContributionMargin =
      Math.round((foodhubNetRevenue + totalDeliveryFees - totalRiderCosts) * 100) / 100;
    const avgOrderValue =
      completedOrdersCount > 0
        ? Math.round((grossCustomerCollections / completedOrdersCount) * 100) / 100
        : 0;

    // 4. Daily Revenue & Order Trend Array
    const revenueTrend = await this.getRevenueBreakdown(days);

    // 5. Category Distribution Calculation from actual order items
    const categoryTotals: Record<string, number> = {};
    for (const ord of periodOrders) {
      for (const item of ord.orderItems || []) {
        const catName = item.foodItem?.category?.name || 'Other';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(item.totalPrice || 0);
      }
    }

    const colorPalette = [
      '#9333ea',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#6366f1',
      '#ec4899',
    ];
    let categoryDistribution = Object.entries(categoryTotals).map(([name, value], idx) => ({
      name,
      value: Math.round(value),
      color: colorPalette[idx % colorPalette.length],
    }));

    if (categoryDistribution.length === 0 && categories.length > 0) {
      categoryDistribution = categories.slice(0, 5).map((c, idx) => ({
        name: c.name,
        value: 0,
        color: colorPalette[idx % colorPalette.length],
      }));
    }

    // 6. Peak Ordering Hours from Real Orders in Period
    const hourCounts: Record<number, number> = {};
    for (const ord of periodOrders) {
      const hour = new Date(ord.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const peakHours = [12, 13, 14, 19, 20, 21, 22].map((h) => ({
      hour: h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`,
      orders: hourCounts[h] || 0,
    }));

    return {
      range,
      kpis: {
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayRevenueGrowth,
        todayOrders: todayOrdersCount,
        todayOrdersGrowth,
        periodRevenue: Math.round(grossCustomerCollections * 100) / 100,
        platformCommission: Math.round(totalPlatformCommission * 100) / 100,
        platformFees: Math.round(totalPlatformFees * 100) / 100,
        deliveryFees: Math.round(totalDeliveryFees * 100) / 100,
        foodhubNetRevenue,
        platformContributionMargin,
        activeCustomers,
        activeRestaurants,
        activeDrivers: approvedDrivers,
        onlineDrivers,
        pendingApprovals: pendingRestaurantsCount,
        pendingDriverApprovals: pendingDriversCount,
        avgOrderValue,
        avgDeliveryTime: 25,
        totalOrders: periodOrders.length,
        completedOrders: completedOrdersCount,
        pendingOrders: pendingOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        refundAmount: Number(refundTotalAgg._sum.amount ?? 0),
        statutoryGst: Math.round(totalTaxCollected * 100) / 100,
      },
      revenueTrend,
      categoryDistribution,
      peakHours,
    };
  }

  // ── REVENUE BREAKDOWN ──────────────────────────────────────────────────────

  async getRevenueBreakdown(days: number) {
    const result: Array<{ date: string; revenue: number; orders: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const from = daysAgo(i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);

      const agg = await this.prisma.restaurantSettlement.aggregate({
        where: { periodStart: { gte: from, lt: to } },
        _sum: { grossAmount: true },
        _count: { id: true },
      });

      const dayLabel =
        days <= 7
          ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][from.getDay()]
          : from.toISOString().slice(5, 10);

      result.push({
        date: dayLabel,
        revenue: Math.round(Number(agg._sum.grossAmount ?? 0) * 100) / 100,
        orders: agg._count.id,
      });
    }

    return result;
  }

  // ── PEAK ORDERING HOUR ─────────────────────────────────────────────────────

  private async getPeakOrderingHour(): Promise<number> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ hour: number; cnt: bigint }>>`
        SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata') AS hour,
               COUNT(*) AS cnt
        FROM   orders
        WHERE  created_at >= NOW() - INTERVAL '30 days'
        GROUP  BY hour
        ORDER  BY cnt DESC
        LIMIT  1
      `;
      return rows[0] ? Number(rows[0].hour) : 19;
    } catch {
      return 19;
    }
  }

  // ── RESTAURANT ANALYTICS ───────────────────────────────────────────────────

      async getRestaurantStats(restaurantId: string, range: string = '7D') {
    const today = startOfDay(new Date());
    let fromDate = daysAgo(7);
    if (range === '30D') fromDate = daysAgo(30);
    else if (range === '90D') fromDate = daysAgo(90);

    const [
      activeSales,
      todaySales,
      completedOrdersCount,
      cancelledOrdersCount,
      pendingOrdersCount,
      topItems,
      reviews,
      activeSettlements,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: fromDate }, paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: today }, paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.order.count({ where: { restaurantId, status: 'DELIVERED', createdAt: { gte: fromDate } } }),
      this.prisma.order.count({ where: { restaurantId, status: 'CANCELLED', createdAt: { gte: fromDate } } }),
      this.prisma.order.count({
        where: { restaurantId, status: { in: ['PENDING', 'PREPARING'] } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['foodItemId'],
        where: { order: { restaurantId, createdAt: { gte: fromDate } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.restaurantReview.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.restaurantSettlement.aggregate({
        where: { restaurantId, periodStart: { gte: fromDate } },
        _sum: { netPayable: true, commissionAmount: true },
      }),
    ]);

    // Build the weekly breakdown for the chart, adjusted to the range
    const days = range === '30D' ? 30 : range === '90D' ? 90 : 7;
    const weeklyBreakdown = [];
    for (let i = days - 1; i >= 0; i--) {
      const dStart = daysAgo(i);
      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);
      
      const dayData = await this.prisma.restaurantSettlement.aggregate({
          where: { restaurantId, periodStart: { gte: dStart, lte: dEnd } },
          _sum: { grossAmount: true },
          _count: { id: true },
        });
      weeklyBreakdown.push({
        day: dStart.toISOString().slice(0, 10),
        revenue: Number(dayData._sum.grossAmount || 0),
        orders: dayData._count.id,
      });
    }

    const avgRat = Math.round(Number(reviews._avg.rating ?? 4.5) * 100) / 100;
    const activeRevenue = Number(activeSales._sum.totalAmount || 0);

    return {
      activeRevenue,
      activeNetPayout: Number(activeSettlements?._sum?.netPayable || 0),
      activeCommission: Number(activeSettlements?._sum?.commissionAmount || 0),
      activeOrdersCount: activeSales._count.id,
      todayRevenue: Number(todaySales._sum.totalAmount || 0),
      todayOrders: todaySales._count.id,
      completedOrders: completedOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      pendingOrders: pendingOrdersCount,
      avgRating: avgRat,
      totalReviews: reviews._count.id,
      reviewCount: reviews._count.id,
      topItems: topItems.map((i) => ({ foodItemId: i.foodItemId, qty: i._sum.quantity })),
      weeklyRevenueData: weeklyBreakdown,
    };
  }


  // ── DRIVER ANALYTICS ───────────────────────────────────────────────────────

  async getDriverStats(driverId: string) {
    const today = startOfDay(new Date());
    const week = daysAgo(7);
    const month = daysAgo(30);

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { avgRating: true, driverWallet: { select: { balance: true } } },
    });

    const [todayDeliveries, weekDeliveries, monthDeliveries] = await Promise.all([
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: 'DELIVERED', offeredAt: { gte: today } },
      }),
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: 'DELIVERED', offeredAt: { gte: week } },
      }),
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: 'DELIVERED', offeredAt: { gte: month } },
      }),
    ]);

    const [totalAssigned, cancelledCount] = await Promise.all([
      this.prisma.deliveryAssignment.count({ where: { driverId, offeredAt: { gte: month } } }),
      this.prisma.deliveryAssignment.count({
        where: { driverId, status: 'CANCELLED', offeredAt: { gte: month } },
      }),
    ]);

    const acceptanceRate =
      totalAssigned > 0 ? Math.round((monthDeliveries / totalAssigned) * 100) : 0;

    return {
      today: { deliveries: todayDeliveries, earnings: todayDeliveries * 50 },
      week: { deliveries: weekDeliveries, earnings: weekDeliveries * 50 },
      month: { deliveries: monthDeliveries, earnings: monthDeliveries * 50 },
      cancelled: cancelledCount,
      acceptanceRate,
      completionRate: 100 - Math.round((cancelledCount / (totalAssigned || 1)) * 100),
      avgRating: Number(driver?.avgRating ?? 0),
      walletBalance: Number(driver?.driverWallet?.balance ?? 0),
    };
  }

  // ── CUSTOMER ANALYTICS ─────────────────────────────────────────────────────

  async getCustomerStats(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { userId },
      include: { orders: { select: { totalAmount: true, restaurantId: true } } },
    });

    if (!customer) return null;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const couponsUsed = await this.prisma.couponUsage.count({ where: { customerId: customer.id } });
    const referrals = await this.prisma.referral.count({ where: { referrerId: customer.id } });

    const totalSpent = customer.orders.reduce((s, o) => s + Number(o.totalAmount), 0);

    // Favorite restaurant (most ordered from)
    const restaurantFreq: Record<string, number> = {};
    customer.orders.forEach((o) => {
      restaurantFreq[o.restaurantId] = (restaurantFreq[o.restaurantId] ?? 0) + 1;
    });
    const favRestaurantId = Object.entries(restaurantFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

    let favRestaurantName = 'N/A';
    if (favRestaurantId) {
      const r = await this.prisma.restaurant.findUnique({
        where: { id: favRestaurantId },
        select: { name: true },
      });
      favRestaurantName = r?.name ?? 'N/A';
    }

    return {
      totalOrders: customer.orders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      walletBalance: Number(wallet?.balance ?? 0),
      couponsUsed,
      referralEarnings: referrals * 50,
      favoriteRestaurant: favRestaurantName,
    };
  }

  // ── SALES REPORT ───────────────────────────────────────────────────────────

  async getSalesReport(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, paymentStatus: PaymentStatus.COMPLETED },
      select: {
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        restaurant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      rows: orders.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString().slice(0, 10),
        restaurant: o.restaurant.name,
        amount: Number(o.totalAmount),
        status: o.status,
        paymentMethod: o.paymentMethod,
      })),
    };
  }

  // ── CSV EXPORT ─────────────────────────────────────────────────────────────

    async exportRestaurantCsv(restaurantId: string, type: string, from: Date, to: Date): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: from, lte: to } },
      include: {
        customer: { include: { user: { include: { profile: true } } } },
        restaurantSettlement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = orders.map((o) => ({
      OrderNo: o.orderNumber,
      Date: o.createdAt.toISOString().slice(0, 10),
      Status: o.status,
      Customer: o.customer?.user?.profile?.firstName || 'Guest',
      GrossSales: Number(o.totalAmount),
      Commission: o.restaurantSettlement ? Number(o.restaurantSettlement.commissionAmount) : 0,
      NetPayout: o.restaurantSettlement ? Number(o.restaurantSettlement.netPayable) : 0,
    }));

    return formatCsv(rows);
  }


  async exportCsv(type: string, from: Date, to: Date): Promise<string> {
    if (type === 'orders' || type === 'revenue') {
      const report = await this.getSalesReport(from, to);
      return formatCsv(report.rows);
    }

    if (type === 'customers') {
      const customers = await this.prisma.customer.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { id: true, createdAt: true, user: { select: { phone: true, email: true } } },
        take: 500,
      });
      return formatCsv(
        customers.map((c) => ({
          id: c.id,
          phone: c.user.phone,
          email: c.user.email ?? '',
          joinedAt: c.createdAt.toISOString().slice(0, 10),
        })),
      );
    }

    if (type === 'drivers') {
      const drivers = await this.prisma.driver.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { user: { include: { profile: true } }, vehicles: true },
        take: 500,
      });
      return formatCsv(
        drivers.map((d) => ({
          id: d.id,
          name: d.user?.profile
            ? `${d.user.profile.firstName} ${d.user.profile.lastName || ''}`.trim()
            : 'Driver',
          phone: d.user?.phone ?? '',
          licenseNumber: d.licenseNumber,
          status: d.status,
          isApproved: d.isApproved ? 'YES' : 'NO',
          vehicleType: d.vehicles[0]?.vehicleType ?? 'N/A',
          createdAt: d.createdAt.toISOString().slice(0, 10),
        })),
      );
    }

    if (type === 'settlements') {
      const settlements = await this.prisma.restaurantSettlement.findMany({
        where: { settledAt: { gte: from, lte: to } },
        take: 500,
      });
      return formatCsv(
        settlements.map((s) => ({
          id: s.id,
          restaurantId: s.restaurantId,
          amount: Number(s.netPayable || 0),
          utrNumber: s.utrNumber,
          settledAt: s.settledAt ? s.settledAt.toISOString().slice(0, 10) : 'PENDING',
        })),
      );
    }

    if (type === 'coupons') {
      const coupons = await this.prisma.coupon.findMany({
        include: { usages: true },
        take: 500,
      });
      return formatCsv(
        coupons.map((c) => ({
          code: c.code,
          couponType: c.couponType,
          discountValue: Number(c.discountVal),
          minOrderAmount: Number(c.minOrderVal),
          usageLimit: c.usageLimit,
          usedCount: c.usages?.length || 0,
          status: c.status,
        })),
      );
    }

    return '';
  }
}








