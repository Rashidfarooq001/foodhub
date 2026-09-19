const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const cols = await client.query("SELECT table_schema, column_name, data_type FROM information_schema.columns WHERE table_name = 'delivery_jobs'");
  console.table(cols.rows);
  await client.end();
}
run().catch(console.error);