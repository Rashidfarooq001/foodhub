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
  /async getRiderSettlements\([\s\S]*?\/\*\*[\s\S]*?async getRiderSettlementDetail/m,
  `async getRiderSettlements(
    periodType: string = 'current',
    customStart?: string,
    customEnd?: string,
  ) {
    const period = getWeeklyPeriod(periodType, customStart, customEnd);
    const { periodStart, periodEnd } = period;

    const drivers = await this.prisma.driver.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { id: true, phone: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        vehicles: { take: 1, select: { vehicleNumber: true, vehicleType: true } },
      },
    });

    const settlements = await this.prisma.riderSettlement.findMany({
      where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }
    });

    let totalEarnings = 0, totalPaid = 0, totalPending = 0;
    const summaryMap = new Map();
    for (const d of drivers) summaryMap.set(d.id, {
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
      period: { type: periodType, start: periodStart, end: periodEnd },
      summary: { totalEarnings, totalPaid, totalPending, totalActiveRiders: drivers.length },
      data: Array.from(summaryMap.values()),
    };
  }

  /**
   * Detailed view for a single rider
   */
  async getRiderSettlementDetail`,
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched getRiderSettlements.');
