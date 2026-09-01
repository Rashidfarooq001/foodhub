const { PrismaClient } = require('@prisma/client');
const { RestaurantsService } = require('./src/modules/restaurants/restaurants.service');
const { PrismaService } = require('./src/prisma/prisma.service');
const { EventEmitter2 } = require('@nestjs/event-emitter');

async function run() {
  const prisma = new PrismaClient({
    datasourceUrl:
      'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
  });

  // Create a mock service
  const service = new RestaurantsService(prisma, new EventEmitter2());

  try {
    const res = await service.updateVerificationStatus(
      '5aad6d8f-84ca-4887-9849-ae2efa4a0e70',
      'APPROVED',
      null,
      '14d82b2f-7640-4795-82be-bdbb65a9182d',
    );
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
