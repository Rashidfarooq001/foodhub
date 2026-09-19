const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'otps'");
  console.table(cols.rows);
  await client.end();
}
run().catch(console.error);