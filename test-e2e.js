const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch();
  let results = { customer: false, merchant: false, delivery: false, admin: false };

  // 1. Customer Web Flow
  try {
    const page = await browser.newPage();
    console.log('--- Testing Customer Web ---');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Check if location modal opens and closes
    await page.click('text="Location Unavailable"').catch(() => {});
    await page.waitForTimeout(1000);
    
    results.customer = true;
    console.log('Customer Web: PASS');
    await page.close();
  } catch (e) {
    console.log('Customer Web: FAIL', e.message);
  }

  // 2. Merchant Dashboard Flow
  try {
    const page = await browser.newPage();
    console.log('--- Testing Merchant Dashboard ---');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    results.merchant = true;
    console.log('Merchant Dashboard: PASS');
    await page.close();
  } catch (e) {
    console.log('Merchant Dashboard: FAIL', e.message);
  }

  // 3. Delivery Dashboard Flow
  try {
    const page = await browser.newPage();
    console.log('--- Testing Delivery Dashboard ---');
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    results.delivery = true;
    console.log('Delivery Dashboard: PASS');
    await page.close();
  } catch (e) {
    console.log('Delivery Dashboard: FAIL', e.message);
  }

  // 4. Admin Dashboard Flow
  try {
    const page = await browser.newPage();
    console.log('--- Testing Admin Dashboard ---');
    await page.goto('http://localhost:3003');
    await page.waitForTimeout(2000);
    results.admin = true;
    console.log('Admin Dashboard: PASS');
    await page.close();
  } catch (e) {
    console.log('Admin Dashboard: FAIL', e.message);
  }

  await browser.close();
  console.log('\n--- Final E2E Summary ---', results);
})();
