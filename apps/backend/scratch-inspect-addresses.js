const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const addresses = await prisma.customerAddress.findMany({
    take: 50,
    include: {
      customer: {
        include: {
          user: {
            select: { id: true, phone: true, email: true, role: true },
          },
        },
      },
    },
  });

  console.log('--- ALL CUSTOMER ADDRESSES IN DATABASE ---');
  addresses.forEach((a, idx) => {
    console.log(`\n[Address ${idx + 1}] ID: ${a.id}`);
    console.log(`Label: "${a.addressLabel}"`);
    console.log(`Address: "${a.addressLine1}, ${a.addressLine2 || ''}, ${a.city}, ${a.state}"`);
    console.log(`Coordinates: (${a.latitude}, ${a.longitude})`);
    console.log(
      `Associated User: ID ${a.customer?.user?.id} | Phone: "${a.customer?.user?.phone}" | Role: ${a.customer?.user?.role}`,
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
