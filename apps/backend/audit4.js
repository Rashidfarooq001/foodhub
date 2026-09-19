const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: 'postgresql://rashid:zzqmt1-REpJDao-fg3up7Q@mud-llama-33276.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full'
  });
  await client.connect();
  const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_jobs'`);
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}
run();
