const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to http://localhost:3001/partner/register ...');
  await page.goto('http://localhost:3001/partner/register');

  await page.waitForTimeout(3000);
  
  await browser.close();
  console.log('Done.');
})();
