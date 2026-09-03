require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const allOrders = await prisma.order.findMany();
  console.log("ALL ORDERS:", allOrders.map(o => ({ id: o.id, createdAt: o.createdAt, status: o.status, paymentStatus: o.paymentStatus, totalAmount: o.totalAmount.toString() })));
  const allSettlements = await prisma.restaurantSettlement.findMany();
  console.log("ALL SETTLEMENTS:", allSettlements.map(s => ({ id: s.id, orderId: s.orderId, periodStart: s.periodStart, grossAmount: s.grossAmount.toString() })));
}
run();
