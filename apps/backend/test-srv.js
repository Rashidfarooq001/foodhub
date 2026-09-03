const { PrismaClient } = require('@prisma/client');
const { SettlementsService } = require('./dist/modules/settlements/settlements.service.js');
const prisma = new PrismaClient();
const service = new SettlementsService(prisma);
async function run() {
  const data = await service.getWeeklyRestaurantSettlements('current');
  console.log(JSON.stringify(data.data, null, 2));
  await prisma.$disconnect();
}
run();
