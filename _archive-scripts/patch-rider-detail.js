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

content = content.replace(
  /async getRiderSettlementDetail\([\s\S]*?async recordRiderPayment/m,
  `async getRiderSettlementDetail(
    driverId: string,
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const settlements = await this.prisma.riderSettlement.findMany({
      where: { driverId, periodStart: { gte: period.periodStart }, periodEnd: { lte: period.periodEnd } },
      include: { order: true }
    });

    let totalEarnings = 0, paidAmount = 0, pendingAmount = 0;
    const deliveries = settlements.map(s => {
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
        status: pendingAmount === 0 ? 'PAID' : 'PENDING'
      },
      deliveries,
      history: []
    };
  }

  async recordRiderPayment`,
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched getRiderSettlementDetail.');
