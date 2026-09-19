const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: 'postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full'
  });
  await client.connect();
  
  try {
    await client.query('ALTER TABLE delivery_jobs ADD COLUMN pending_driver_id UUID');
    console.log('Added pending_driver_id');
  } catch (e) { console.log(e.message); }

  try {
    await client.query('ALTER TABLE delivery_jobs ADD COLUMN notification_sent_at TIMESTAMP(3)');
    console.log('Added notification_sent_at');
  } catch (e) { console.log(e.message); }
  
  await client.end();
}
run();
