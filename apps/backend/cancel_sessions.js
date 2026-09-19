const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('CANCEL SESSION(SELECT session_id FROM [SHOW SESSIONS] WHERE session_id != generate_uid())');
  console.log('Cancelled other sessions');
  await client.end();
}
run().catch(console.error);