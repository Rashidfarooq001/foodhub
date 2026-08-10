const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FINDING ALL USERS IN DATABASE ===\n');

  const allUsers = await prisma.user.findMany({
    include: {
      profile: true,
    },
  });

  console.log(`Total Users in DB: ${allUsers.length}`);
  allUsers.forEach((u, i) => {
    console.log(`\nUser #${i + 1}:`);
    console.log(`  ID:    ${u.id}`);
    console.log(`  Phone: ${u.phone}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role:  ${u.role}`);
    console.log(`  Active:${u.isActive}`);
    console.log(`  Name:  ${u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'N/A'}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
