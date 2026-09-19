const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at ASC');
  console.table(res.rows);
  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'delivery_jobs'");
  console.table(cols.rows);
  await client.end();
}
run().catch(console.error);