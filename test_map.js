const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('mappls.com') || url.includes('mapmyindia.com')) {
      console.log(`[NETWORK] ${response.status()} ${url}`);
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=5b266e746535560938f37ccb83921508"></script>
        <style>#map { width: 100vw; height: 100vh; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          setTimeout(() => {
            if (window.mappls) {
              console.log('Initializing map');
              new window.mappls.Map('map', { center: {lat: 28, lng: 77}, zoom: 10 });
            } else {
              console.log('mappls not found');
            }
          }, 1000);
        </script>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
