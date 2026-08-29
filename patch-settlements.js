const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'settlements', 'settlements.service.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace getFinanceOverview
content = content.replace(/async getFinanceOverview\([\s\S]*?async getUnifiedTransactions/m, `async getFinanceOverview(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const [restSettlements, riderSettlements, orders] = await Promise.all([
      this.prisma.restaurantSettlement.findMany({
        where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }
      }),
      this.prisma.riderSettlement.findMany({
        where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }
      }),
      this.prisma.order.findMany({
        where: { status: 'DELIVERED', createdAt: { gte: periodStart, lte: periodEnd } },
        select: { pricingSnapshot: true }
      })
    ]);

    let totalGrossSales = 0;
    let totalRestaurantPayable = 0;
    let pendingRestaurantSettlements = 0;
    let paidRestaurantSettlements = 0;
    let failedSettlements = 0;
    let totalCommission = 0;

    for (const s of restSettlements) {
      totalGrossSales += Number(s.grossAmount);
      totalRestaurantPayable += Number(s.netPayable);
      totalCommission += Number(s.commissionAmount);
      if (s.status === 'PAID') {
        paidRestaurantSettlements += Number(s.paidAmount || s.netPayable);
      } else if (s.status === 'FAILED') {
        failedSettlements++;
      } else {
        pendingRestaurantSettlements += Number(s.netPayable);
      }
    }

    let totalRiderPayable = 0;
    let pendingRiderSettlements = 0;
    let paidRiderSettlements = 0;

    for (const s of riderSettlements) {
      const net = Number(s.netPayable);
      totalRiderPayable += net;
      if (s.status === 'PAID') {
        paidRiderSettlements += Number(s.paidAmount || net);
      } else {
        pendingRiderSettlements += net;
      }
    }

    let totalPlatformRevenue = 0;
    for (const o of orders) {
      const snap: any = o.pricingSnapshot || {};
      totalPlatformRevenue += Number(snap.platformFee || 0) + Number(snap.commissionAmount || 0);
    }

    return {
      period: {
        type: periodType,
        start: periodStart,
        end: periodEnd,
        label: period.periodLabel,
      },
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

  async getUnifiedTransactions`);

// Fix findMany Settlements to findMany RestaurantSettlements
content = content.replace(/this\.prisma\.settlement\.find/g, 'this.prisma.restaurantSettlement.find');
content = content.replace(/this\.prisma\.settlement\.update/g, 'this.prisma.restaurantSettlement.update');
content = content.replace(/this\.prisma\.settlement\.create/g, 'this.prisma.restaurantSettlement.create');
content = content.replace(/this\.prisma\.settlement\.upsert/g, 'this.prisma.restaurantSettlement.upsert');
content = content.replace(/SettlementStatus\.SETTLED/g, "SettlementStatus.PAID");
content = content.replace(/SettlementStatus\.PAYOUT_FAILED/g, "SettlementStatus.FAILED");

fs.writeFileSync(file, content, 'utf8');
console.log("Patched settlements.service.ts");
