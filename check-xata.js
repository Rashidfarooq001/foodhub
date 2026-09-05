const { Client } = require('pg');

async function countData() {
  const xataUrl = "postgresql://xata:NVMQa777Q7BsJsXq7fRrzNHSR2Uw7QFnRP28BgcEdxqBPOKPwGATUJWh2ivZiMgi@m4j4guhju95knfng9pm4f0dthc.us-east-1.xata.tech/xata?sslmode=require";
  const client = new Client({ connectionString: xataUrl });
  
  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);
    
    let totalRows = 0;
    for (const row of result.rows) {
      const table = row.table_name;
      // Skip prisma migrations table
      if (table === '_prisma_migrations') continue;
      
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = parseInt(countRes.rows[0].count, 10);
      if (count > 0) {
        console.log(`Table ${table}: ${count} rows`);
        totalRows += count;
      }
    }
    console.log(`Total rows across all tables: ${totalRows}`);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
countData();
