const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT pid, query, state FROM pg_stat_activity WHERE query != \'<IDLE>\'');
  console.table(res.rows);
  await client.end();
}
run().catch(console.error);