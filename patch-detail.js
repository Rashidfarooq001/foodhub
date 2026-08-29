const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'settlements', 'settlements.service.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/async getRestaurantSettlementDetail\([\s\S]*?\/\*\*[\s\S]*?async recordRestaurantPayment/m, `async getRestaurantSettlementDetail(
    restaurantId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
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
      if (s.status === 'PAID') paidAmount += Number(s.netPayable);
      else pendingAmount += Number(s.netPayable);

      return {
        orderId: s.orderId,
        orderNumber: s.order?.orderNumber,
        status: s.order?.status,
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
        status: pendingAmount === 0 ? 'PAID' : 'PENDING'
      },
      orders
    };
  }

  /**
   * Record manual settlement payment
   */
  async recordRestaurantPayment`);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched getRestaurantSettlementDetail.");
