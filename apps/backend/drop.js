const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full' });
  await client.connect();
  await client.query('ALTER TABLE delivery_jobs DROP COLUMN IF EXISTS pending_driver_id');
  await client.end();
}
run();
