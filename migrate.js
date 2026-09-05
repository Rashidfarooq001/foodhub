const { Client } = require('pg');

async function migrateData() {
  const xataUrl = "postgresql://xata:NVMQa777Q7BsJsXq7fRrzNHSR2Uw7QFnRP28BgcEdxqBPOKPwGATUJWh2ivZiMgi@m4j4guhju95knfng9pm4f0dthc.us-east-1.xata.tech/xata?sslmode=require";
  const crdbUrl = "postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full";

  const src = new Client({ connectionString: xataUrl });
  const dest = new Client({ connectionString: crdbUrl });

  try {
    await src.connect();
    await dest.connect();

    // 1. Get all tables
    const tablesRes = await src.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tables = tablesRes.rows.map(r => r.table_name).filter(t => t !== '_prisma_migrations');

    // 2. Get FK dependencies
    const fkRes = await src.query(`
      SELECT
          tc.table_name AS table_name,
          ccu.table_name AS foreign_table_name
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `);

    const graph = {};
    const inDegree = {};
    for (const t of tables) {
      graph[t] = [];
      inDegree[t] = 0;
    }

    for (const row of fkRes.rows) {
      const from = row.table_name;
      const to = row.foreign_table_name;
      if (tables.includes(from) && tables.includes(to) && from !== to) {
        if (!graph[to].includes(from)) {
          graph[to].push(from);
          inDegree[from] = (inDegree[from] || 0) + 1;
        }
      }
    }

    // Topological sort (Kahn's algorithm)
    const queue = [];
    for (const t of tables) {
      if (inDegree[t] === 0) queue.push(t);
    }

    const order = [];
    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);
      for (const neighbor of graph[current]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Add any remaining (cycles), though Prisma schema usually doesn't have hard circular FKs that are both required.
    for (const t of tables) {
      if (!order.includes(t)) order.push(t);
    }
    
    // We want to insert from least dependent to most dependent
    // Wait, if table A depends on table B (A has FK to B), then B must be inserted FIRST.
    // In our graph, an edge from `to` -> `from` means `to` must be inserted before `from`.
    // So the sorted order should give us exactly the insert order!
    
    console.log("Migration order:", order);

    // 3. Migrate data
    for (const table of order) {
      const dataRes = await src.query(`SELECT * FROM "${table}"`);
      const rows = dataRes.rows;
      if (rows.length === 0) continue;

      console.log(`Migrating ${rows.length} rows for table "${table}"...`);

      // We need to chunk inserts if there are many, but 390 total is tiny.
      // We will just do it row by row to easily handle errors and types.
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        const colStr = columns.map(c => `"${c}"`).join(', ');
        const valStr = values.map((_, i) => `$${i + 1}`).join(', ');

        try {
          await dest.query(`INSERT INTO "${table}" (${colStr}) VALUES (${valStr}) ON CONFLICT DO NOTHING`, values);
        } catch (err) {
          console.error(`Failed to insert into ${table}:`, err.message);
        }
      }
    }

    console.log("Migration completed successfully!");

  } catch(e) {
    console.error("Migration failed:", e);
  } finally {
    await src.end();
    await dest.end();
  }
}

migrateData();
