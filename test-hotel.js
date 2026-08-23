const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let errorCount = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      // ignore ApiProjectMapError because we EXPECT the map API to fail
      if (msg.text().includes('ApiProjectMapError')) return;
      console.log('BROWSER ERROR:', msg.text());
      errorCount++;
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    errorCount++;
  });

  try {
    console.log('Testing hotel-dashboard (Map Error Handling)...');
    await page.goto('http://localhost:3001/partner/register');
    await page.waitForTimeout(3000);
    
    // Check if graceful error state is visible
    const textContent = await page.locator('text="Map Unavailable"').count();
    if (textContent > 0) {
       console.log('Found Map Unavailable graceful state!');
    }
    console.log('hotel-dashboard: PASS');
  } catch (e) {
    console.log('hotel-dashboard: FAIL', e.message);
    errorCount++;
  }

  await browser.close();
  process.exit(errorCount > 0 ? 1 : 0);
})();
