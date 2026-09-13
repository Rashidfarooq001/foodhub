const { PrismaClient } = require('./apps/backend/node_modules/@prisma/client');
const p = new PrismaClient({datasources:{db::url:'postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full'}}});
p.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name='delivery_jobs'')
  .then(res => { console.log(res); process.exit(0); })
  .catch(console.error);