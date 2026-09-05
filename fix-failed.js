const { Client } = require('pg');

async function fixFailed() {
  const xataUrl = "postgresql://xata:NVMQa777Q7BsJsXq7fRrzNHSR2Uw7QFnRP28BgcEdxqBPOKPwGATUJWh2ivZiMgi@m4j4guhju95knfng9pm4f0dthc.us-east-1.xata.tech/xata?sslmode=require";
  const crdbUrl = "postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full";

  const src = new Client({ connectionString: xataUrl });
  const dest = new Client({ connectionString: crdbUrl });

  try {
    await src.connect();
    await dest.connect();

    // Fix orders
    const ordersRes = await src.query(`SELECT * FROM "orders"`);
    for (const row of ordersRes.rows) {
      // Fix JSONB arrays by parsing them if they are string arrays
      for (const key in row) {
        if (Array.isArray(row[key]) && typeof row[key][0] === 'string' && row[key][0].startsWith('{')) {
          try {
            // Attempt to parse array of strings into array of objects
            row[key] = row[key].map(str => JSON.parse(str));
          } catch(e) {}
        }
      }
      
      const columns = Object.keys(row);
      const values = Object.values(row).map(v => {
        if (Array.isArray(v)) {
          return JSON.stringify(v); // stringify arrays of json for pg
        }
        return v;
      });

      const colStr = columns.map(c => `"${c}"`).join(', ');
      const valStr = values.map((_, i) => `$${i + 1}`).join(', ');

      try {
        await dest.query(`INSERT INTO "orders" (${colStr}) VALUES (${valStr}) ON CONFLICT DO NOTHING`, values);
      } catch (err) {
        // try casting jsonb arrays
        if (err.message.includes('jsonb')) {
           const valStrCast = values.map((v, i) => {
             if (Array.isArray(v) || typeof v === 'string' && v.startsWith('[')) return `$${i + 1}::jsonb`;
             return `$${i + 1}`;
           }).join(', ');
           try {
             await dest.query(`INSERT INTO "orders" (${colStr}) VALUES (${valStrCast}) ON CONFLICT DO NOTHING`, values);
           } catch(e) {
             console.log("Still failed orders", e.message);
           }
        } else {
           console.log("orders err:", err.message);
        }
      }
    }

    // Fix settlements
    const setRes = await src.query(`SELECT * FROM "settlements"`);
    for (const row of setRes.rows) {
      delete row.paid_amount; // Remove the removed column
      
      const columns = Object.keys(row);
      const values = Object.values(row);
      const colStr = columns.map(c => `"${c}"`).join(', ');
      const valStr = values.map((_, i) => `$${i + 1}`).join(', ');

      try {
        await dest.query(`INSERT INTO "settlements" (${colStr}) VALUES (${valStr}) ON CONFLICT DO NOTHING`, values);
      } catch (err) {
        console.log("settlements err:", err.message);
      }
    }

    console.log("Orders and settlements patched!");

  } catch(e) {
    console.error(e);
  } finally {
    await src.end();
    await dest.end();
  }
}

fixFailed();
