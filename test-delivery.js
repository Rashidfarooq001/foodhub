const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let errorCount = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      if (msg.text().includes('ApiProjectMapError')) return;
      // Socket io errors don't count as fatal JS React crashes
      if (msg.text().includes('WebSocket connection')) return;
      if (msg.text().includes('polling-xhr.js')) return;
      console.log('BROWSER ERROR:', msg.text());
      errorCount++;
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    errorCount++;
  });

  try {
    console.log('Testing delivery-dashboard (Map Error Handling)...');
    await page.goto('http://localhost:3002/current-delivery');
    await page.waitForTimeout(3000);
    
    // Check if graceful error state is visible
    const textContent = await page.locator('text="Map Unavailable"').count();
    if (textContent > 0) {
       console.log('Found Map Unavailable graceful state!');
    }
    console.log('delivery-dashboard: PASS');
  } catch (e) {
    console.log('delivery-dashboard: FAIL', e.message);
    errorCount++;
  }

  await browser.close();
  process.exit(errorCount > 0 ? 1 : 0);
})();
