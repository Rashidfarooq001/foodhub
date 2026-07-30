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
  const lines   = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(','),
    ),
  ];
  return lines.join('\n');
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── ADMIN DASHBOARD ────────────────────────────────────────────────────────

  async getAdminDashboard() {
    const today     = startOfDay(new Date());
    const week      = daysAgo(7);
    const month     = daysAgo(30);

    // Aggregate counts
    const [
      todayOrders, weekOrders, monthOrders,
      todayRevenue, weekRevenue, monthRevenue,
      activeCustomers, activeRestaurants, activeDrivers,
      settlementsCount, cancelledOrders, refundTotal,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { createdAt: { gte: week } } }),
      this.prisma.order.count({ where: { createdAt: { gte: month } } }),
      this.prisma.order.aggregate({
        where:   { createdAt: { gte: today }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:    { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where:   { createdAt: { gte: week }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:    { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where:   { createdAt: { gte: month }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:    { totalAmount: true },
      }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.restaurant.count({ where: { status: 'APPROVED', deletedAt: null } }),
      this.prisma.driver.count({ where: { isApproved: true, deletedAt: null } }),
      this.prisma.settlement.count(),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED, createdAt: { gte: month } } }),
      this.prisma.paymentRefund.aggregate({ _sum: { amount: true } }),
    ]);

    // Weekly revenue breakdown (last 7 days)
    const weeklyBreakdown = await this.getRevenueBreakdown(7);

    // Peak ordering hour (last 30 days)
    const peakHour = await this.getPeakOrderingHour();

    // Avg order value (last 30 days)
    const avgOrderAgg = await this.prisma.order.aggregate({
      where:  { createdAt: { gte: month }, paymentStatus: PaymentStatus.COMPLETED },
      _avg:   { totalAmount: true },
      _count: { id: true },
    });

    // Platform commission (20% default; rough estimate)
    const monthGross       = Number(monthRevenue._sum.totalAmount ?? 0);
    const platformComm     = Math.round(monthGross * 0.2 * 100) / 100;

    return {
      today: {
        orders:  todayOrders,
        revenue: Number(todayRevenue._sum.totalAmount ?? 0),
      },
      week: {
        orders:  weekOrders,
        revenue: Number(weekRevenue._sum.totalAmount ?? 0),
      },
      month: {
        orders:           monthOrders,
        revenue:          monthGross,
        platformComm,
        cancelledOrders,
        refundAmount:     Number(refundTotal._sum.amount ?? 0),
      },
      users: {
        activeCustomers,
        activeRestaurants,
        activeDrivers,
      },
      settlements: {
        pending: Math.max(12 - settlementsCount, 0),
      },
      avgOrderValue:     Math.round(Number(avgOrderAgg._avg.totalAmount ?? 0) * 100) / 100,
      peakHour,
      weeklyBreakdown,
    };
  }

  // ── REVENUE BREAKDOWN ──────────────────────────────────────────────────────

  async getRevenueBreakdown(days: number) {
    const result: Array<{ date: string; revenue: number; orders: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const from = daysAgo(i);
      const to   = new Date(from);
      to.setDate(to.getDate() + 1);

      const agg = await this.prisma.order.aggregate({
        where:  { createdAt: { gte: from, lt: to }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:   { totalAmount: true },
        _count: { id: true },
      });

      result.push({
        date:    from.toISOString().slice(0, 10),
        revenue: Math.round(Number(agg._sum.totalAmount ?? 0) * 100) / 100,
        orders:  agg._count.id,
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

  async getRestaurantStats(restaurantId: string) {
    const today = startOfDay(new Date());
    const week  = daysAgo(7);
    const month = daysAgo(30);

    const [todaySales, weekSales, monthSales, topItems, reviews] = await Promise.all([
      this.prisma.order.aggregate({
        where:   { restaurantId, createdAt: { gte: today }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:    { totalAmount: true },
        _count:  { id: true },
      }),
      this.prisma.order.aggregate({
        where:   { restaurantId, createdAt: { gte: week }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:    { totalAmount: true },
        _count:  { id: true },
      }),
      this.prisma.order.aggregate({
        where:   { restaurantId, createdAt: { gte: month }, paymentStatus: PaymentStatus.COMPLETED },
        _sum:    { totalAmount: true },
        _count:  { id: true },
      }),
      this.prisma.orderItem.groupBy({
        by:      ['foodItemId'],
        where:   { order: { restaurantId, createdAt: { gte: month } } },
        _sum:    { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take:    5,
      }),
      this.prisma.restaurantReview.aggregate({
        where:  { restaurantId },
        _avg:   { rating: true },
        _count: { id: true },
      }),
    ]);

    const weeklyBreakdown = await this.getRevenueBreakdown(7);

    return {
      today: {
        sales:  Number(todaySales._sum.totalAmount ?? 0),
        orders: todaySales._count.id,
      },
      week: {
        sales:  Number(weekSales._sum.totalAmount ?? 0),
        orders: weekSales._count.id,
      },
      month: {
        sales:  Number(monthSales._sum.totalAmount ?? 0),
        orders: monthSales._count.id,
      },
      topItems:       topItems.map((i) => ({ foodItemId: i.foodItemId, qty: i._sum.quantity })),
      avgRating:      Math.round(Number(reviews._avg.rating ?? 0) * 100) / 100,
      reviewCount:    reviews._count.id,
      weeklyBreakdown,
    };
  }

  // ── DRIVER ANALYTICS ───────────────────────────────────────────────────────

  async getDriverStats(driverId: string) {
    const today = startOfDay(new Date());
    const week  = daysAgo(7);
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

    const acceptanceRate = totalAssigned > 0
      ? Math.round((monthDeliveries / totalAssigned) * 100)
      : 0;

    return {
      today:          { deliveries: todayDeliveries, earnings: todayDeliveries * 50 },
      week:           { deliveries: weekDeliveries,  earnings: weekDeliveries  * 50 },
      month:          { deliveries: monthDeliveries, earnings: monthDeliveries * 50 },
      cancelled:      cancelledCount,
      acceptanceRate,
      completionRate: 100 - Math.round((cancelledCount / (totalAssigned || 1)) * 100),
      avgRating:      Number(driver?.avgRating ?? 0),
      walletBalance:  Number(driver?.driverWallet?.balance ?? 0),
    };
  }

  // ── CUSTOMER ANALYTICS ─────────────────────────────────────────────────────

  async getCustomerStats(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where:   { userId },
      include: { orders: { select: { totalAmount: true, restaurantId: true } } },
    });

    if (!customer) return null;

    const wallet      = await this.prisma.wallet.findUnique({ where: { userId } });
    const couponsUsed = await this.prisma.couponUsage.count({ where: { customerId: customer.id } });
    const referrals   = await this.prisma.referral.count({ where: { referrerId: customer.id } });

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
        where: { id: favRestaurantId }, select: { name: true },
      });
      favRestaurantName = r?.name ?? 'N/A';
    }

    return {
      totalOrders:      customer.orders.length,
      totalSpent:       Math.round(totalSpent * 100) / 100,
      walletBalance:    Number(wallet?.balance ?? 0),
      couponsUsed,
      referralEarnings: referrals * 50,
      favoriteRestaurant: favRestaurantName,
    };
  }

  // ── SALES REPORT ───────────────────────────────────────────────────────────

  async getSalesReport(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where:   { createdAt: { gte: from, lte: to }, paymentStatus: PaymentStatus.COMPLETED },
      select:  {
        orderNumber: true,
        createdAt:   true,
        totalAmount: true,
        status:      true,
        paymentMethod: true,
        restaurant:  { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    1000,
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);

    return {
      from:         from.toISOString(),
      to:           to.toISOString(),
      totalOrders:  orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      rows:         orders.map((o) => ({
        orderNumber:    o.orderNumber,
        date:           o.createdAt.toISOString().slice(0, 10),
        restaurant:     o.restaurant.name,
        amount:         Number(o.totalAmount),
        status:         o.status,
        paymentMethod:  o.paymentMethod,
      })),
    };
  }

  // ── CSV EXPORT ─────────────────────────────────────────────────────────────

  async exportCsv(type: string, from: Date, to: Date): Promise<string> {
    if (type === 'orders' || type === 'revenue') {
      const report = await this.getSalesReport(from, to);
      return formatCsv(report.rows);
    }

    if (type === 'customers') {
      const customers = await this.prisma.customer.findMany({
        where:   { createdAt: { gte: from, lte: to } },
        select:  { id: true, createdAt: true, user: { select: { phone: true, email: true } } },
        take:    500,
      });
      return formatCsv(customers.map((c) => ({
        id:        c.id,
        phone:     c.user.phone,
        email:     c.user.email ?? '',
        joinedAt:  c.createdAt.toISOString().slice(0, 10),
      })));
    }

    if (type === 'restaurants') {
      const restaurants = await this.prisma.restaurant.findMany({
        where:   { createdAt: { gte: from, lte: to } },
        select:  { id: true, name: true, status: true, avgRating: true, createdAt: true },
        take:    500,
      });
      return formatCsv(restaurants.map((r) => ({
        id:        r.id,
        name:      r.name,
        status:    r.status,
        avgRating: Number(r.avgRating),
        createdAt: r.createdAt.toISOString().slice(0, 10),
      })));
    }

    return '';
  }
}
