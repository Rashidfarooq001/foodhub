const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('ALTER TABLE \"delivery_jobs\" ADD COLUMN IF NOT EXISTS \"pending_driver_id\" UUID');
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_jobs'");
  console.table(cols.rows);
  await client.end();
}
run().catch(console.error);