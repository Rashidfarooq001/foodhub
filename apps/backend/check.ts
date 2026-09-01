import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const drivers = await prisma.driver.findMany({
    include: { user: { include: { profile: true } }, vehicles: true },
  });
  console.log('Total Drivers:', drivers.length);
  for (const d of drivers) {
    console.log(
      d.id,
      d.user?.profile?.firstName,
      d.user?.profile?.lastName,
      d.vehicles[0]?.vehicleNumber,
    );
  }
}
main().finally(() => prisma.$disconnect());
