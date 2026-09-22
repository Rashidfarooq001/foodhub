const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const settlements = await p.settlement.findMany({ where: { status: 'PAID' } });
  console.log("Paid settlements:", settlements.length);
  for (const s of settlements) {
    const invNo = `INV-RETRO-${s.id.split('-')[0].toUpperCase()}`;
    await p.settlementInvoice.upsert({
      where: { invoiceNumber: invNo },
      update: {},
      create: {
        invoiceNumber: invNo,
        restaurantId: s.restaurantId,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        grossAmount: s.totalAmount,
        commissionAmount: 0,
        commissionGst: 0,
        commissionTotal: 0,
        netPayable: s.totalAmount,
        paidAmount: s.totalAmount,
        pendingAmount: 0,
        paymentDate: s.updatedAt,
      }
    });
  }
  console.log("Restored retro invoices");
}
main().finally(() => p.$disconnect());
