const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function run() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full'
      }
    }
  });
  try {
    const c = await prisma.order.count();
    console.log('Total orders in CLOUD:', c);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
run();
