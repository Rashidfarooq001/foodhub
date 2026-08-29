const https = require('https');
const urls = [
  'https://foodhub-customer-web-ten.vercel.app',
  'https://foodhub-customer-web-ten.vercel.app/checkout'
];
urls.forEach(url => {
  const u = new URL(url);
  https.get({ hostname: u.hostname, path: u.pathname, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    console.log(`${url} -> HTTP ${res.statusCode}`);
    if (res.statusCode === 200) {
      let html = '';
      res.on('data', c => html += c.toString());
      res.on('end', () => {
        // Find script tags to identify what bundles are loaded
        const scripts = html.match(/src="([^"]*_next[^"]*)"/g) || [];
        console.log('Scripts found:', scripts.length);
        scripts.slice(0, 5).forEach(s => console.log('  ', s));
        
        // Check for GST text
        if (html.includes('GST')) console.log('  HTML contains "GST"');
        if (html.includes('totalCustomerTaxes')) console.log('  HTML contains "totalCustomerTaxes"');
        
        // Find buildId
        const buildIdMatch = html.match(/buildId["\s:]+["']([^"']+)["']/);
        if (buildIdMatch) console.log('  BUILD ID:', buildIdMatch[1]);
        
        // Alternative: look for __NEXT_DATA__
        const nextDataMatch = html.match(/"buildId":"([^"]+)"/);
        if (nextDataMatch) console.log('  NEXT BUILD ID:', nextDataMatch[1]);
      });
    }
  }).on('error', e => console.log(`${url} -> ERROR: ${e.message}`));
});
