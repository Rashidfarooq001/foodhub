const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('ALTER TABLE \"delivery_jobs\" ADD COLUMN IF NOT EXISTS \"offer_expires_at\" TIMESTAMP(3)');
  console.log('1');
  await client.query('ALTER TABLE \"otps\" ADD COLUMN IF NOT EXISTS \"attempts\" INT4 NOT NULL DEFAULT 0');
  console.log('2');
  await client.query('CREATE UNIQUE INDEX IF NOT EXISTS \"coupon_usages_order_id_key\" ON \"coupon_usages\" (\"order_id\")');
  console.log('3');
  await client.query('CREATE UNIQUE INDEX IF NOT EXISTS \"coupon_usages_coupon_id_customer_id_key\" ON \"coupon_usages\" (\"coupon_id\", \"customer_id\")');
  console.log('4');
  await client.query('CREATE UNIQUE INDEX IF NOT EXISTS \"food_reviews_order_id_food_item_id_key\" ON \"food_reviews\" (\"order_id\", \"food_item_id\")');
  console.log('5');
  await client.end();
}
run().catch(console.error);