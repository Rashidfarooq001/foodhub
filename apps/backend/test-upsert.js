const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient({
    datasourceUrl: 'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
  });
  
  try {
    const id = '5aad6d8f-84ca-4887-9849-ae2efa4a0e70';
    const ownerId = '14d82b2f-7640-4795-82be-bdbb65a9182d';
    
    await prisma.restaurantStaff.upsert({
      where: {
        restaurantId_userId: {
          restaurantId: id,
          userId: ownerId,
        },
      },
      update: { designation: 'Owner' },
      create: {
        restaurantId: id,
        userId: ownerId,
        designation: 'Owner',
      },
    });
    console.log("Upsert Success!");
  } catch(e) {
    console.error("Upsert Error:", e);
  }
}
run();
