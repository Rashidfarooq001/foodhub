const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const { startOfWeek, endOfWeek } = require('date-fns');

function getWeeklyPeriod(periodType, customStart, customEnd) {
    if (periodType === 'custom' && customStart && customEnd) {
        return { periodStart: new Date(customStart), periodEnd: new Date(customEnd) };
    }
    const now = new Date();
    let target = now;
    if (periodType === 'last') {
        target = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return {
        periodStart: startOfWeek(target, { weekStartsOn: 1 }),
        periodEnd: endOfWeek(target, { weekStartsOn: 1 }),
    };
}

async function main() {
  const period = getWeeklyPeriod('current');
  console.log("Current Period:", period);

  const invoice = await p.settlementInvoice.findFirst({
    where: {
      restaurantId: '1252fbbb-0ddc-4642-8962-abfd6856625d',
      periodStart: { gte: period.periodStart },
      periodEnd: { lte: period.periodEnd },
    }
  });

  console.log("Found Invoice:", invoice);
}

main().catch(console.error).finally(() => p.$disconnect());
