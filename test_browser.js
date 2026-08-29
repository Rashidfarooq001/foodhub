const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('https://foodhub-customer-web-production.vercel.app/checkout'); // I don't know the URL!
  await browser.close();
})();
