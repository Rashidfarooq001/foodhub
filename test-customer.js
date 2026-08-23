const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let errorCount = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      errorCount++;
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    errorCount++;
  });

  try {
    console.log('Testing customer-web (LocationSelectorModal)...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    await page.click('text="Location Unavailable"');
    await page.waitForTimeout(2000);
    await page.click('button:has(svg.lucide-x)'); // close modal
    await page.waitForTimeout(1000);
    await page.click('text="Location Unavailable"'); // reopen modal
    await page.waitForTimeout(1000);
    console.log('customer-web: PASS');
  } catch (e) {
    console.log('customer-web: FAIL', e.message);
  }

  await browser.close();
  process.exit(errorCount > 0 ? 1 : 0);
})();
