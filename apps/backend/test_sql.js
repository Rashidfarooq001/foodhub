const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('ALTER TABLE \"delivery_jobs\" ADD COLUMN IF NOT EXISTS \"pending_driver_id\" UUID');
  console.log(res);
  await client.end();
}
run().catch(console.error);