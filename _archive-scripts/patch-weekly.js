const fs = require('fs');
const path = require('path');
const file = path.join(
  'apps',
  'backend',
  'src',
  'modules',
  'settlements',
  'settlements.service.ts',
);
let content = fs.readFileSync(file, 'utf8');

// The whole getWeeklyRestaurantSettlements implementation can be replaced with a much simpler one.
content = content.replace(
  /async getWeeklyRestaurantSettlements\([\s\S]*?\/\*\*[\s\S]*?async getRestaurantSettlementDetail/m,
  `async getWeeklyRestaurantSettlements(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const restaurants = await this.prisma.restaurant.findMany({
      select: { id: true, name: true, phone: true, email: true, status: true, bankAccount: true },
    });

    const settlements = await this.prisma.restaurantSettlement.findMany({
      where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }
    });

    let totalGmv = 0;
    let totalCommission = 0;
    let totalRestaurantPayable = 0;
    let totalAlreadyPaid = 0;
    let totalPendingPayable = 0;

    const summaryMap = new Map();
    for (const r of restaurants) summaryMap.set(r.id, {
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
      period: { type: periodType, start: periodStart, end: periodEnd },
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

  /**
   * Get detailed order-level breakdown
   */
  async getRestaurantSettlementDetail`,
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched getWeeklyRestaurantSettlements.');
