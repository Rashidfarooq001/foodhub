const { Client } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // try to get all tables and check their lock status. Wait, SHOW TABLES doesn't return schema_locked usually.
    // Instead we can just try to unlock again specifically for api_keys and see if it fails.
    
    // Wait, let's just forcefully execute `ALTER TABLE "api_keys" SET (schema_locked = false);` again.
    await client.query(`ALTER TABLE "api_keys" SET (schema_locked = false);`);
    console.log("unlocked api_keys");
    
    // Actually, in CockroachDB, Prisma is trying to create an index.
    // If Prisma creates an index, and the table is locked, it fails.
    
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
