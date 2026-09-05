const { Client } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

async function unlockAllTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to CockroachDB');
    
    // Fetch all table names in the public schema
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);

    const tables = result.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables to unlock.`);

    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" SET (schema_locked = false);`);
        console.log(`Unlocked "${table}"`);
      } catch (e) {
        console.error(`Failed to unlock "${table}":`, e.message);
      }
    }
    
    console.log('Finished unlocking all tables.');
  } catch (err) {
    console.error('Error connecting or fetching tables:', err.message);
  } finally {
    await client.end();
  }
}

unlockAllTables();
