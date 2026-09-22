const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function getWeeklyPeriod(periodType, customStart, customEnd) {
    if (periodType === 'custom' && customStart && customEnd) {
        return { periodStart: new Date(customStart), periodEnd: new Date(customEnd) };
    }
    const now = new Date();
    let target = now;
    if (periodType === 'last') {
        target = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Manual start/end of week (Monday to Sunday)
    const day = target.getDay() || 7; // Convert Sunday (0) to 7
    if (day !== 1) target.setHours(-24 * (day - 1));
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return {
        periodStart: start,
        periodEnd: end,
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
