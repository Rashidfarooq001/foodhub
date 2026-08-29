const https = require('https');

// Fetch the cart PAGE (/cart) and find its page-specific chunk
https.get({
  hostname: 'foodhub-customer-web-ten.vercel.app',
  path: '/cart',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let html = '';
  res.on('data', c => html += c.toString());
  res.on('end', () => {
    const scripts = [...html.matchAll(/src="([^"]*_next[^"]*)"/g)].map(m => m[1]);
    // Find scripts unique to cart page (not on checkout page)
    const checkoutScripts = new Set([
      '/_next/static/chunks/1zlmk5jy41bf7.js',
      '/_next/static/chunks/24emi9qwr1pk-.js',
      '/_next/static/chunks/0q9i0yy7-b_oo.js',
      '/_next/static/chunks/2y8e9xht0pnl1.js',
      '/_next/static/chunks/turbopack-22q-ag7-1-tbr.js',
      '/_next/static/chunks/3z0o6g8tgcwqh.js',
      '/_next/static/chunks/0yjrphyvq5c5p.js',
      '/_next/static/chunks/2d4dizjowzgj4.js',
      '/_next/static/chunks/13vrb70bwowk1.js',
      '/_next/static/chunks/3-n7qypmik7zb.js',
      '/_next/static/chunks/2ttfstcplwvay.js',
      '/_next/static/chunks/0cz1d0mv5g_q7.js',
      '/_next/static/chunks/3th38hfydmvo6.js'
    ]);
    
    const cartOnly = scripts.filter(s => !checkoutScripts.has(s));
    console.log('Cart-only scripts:', cartOnly.length);
    cartOnly.forEach(s => console.log(' ', s));
    
    console.log('\nAll cart scripts:');
    scripts.forEach(s => console.log(' ', s));
    
    // Fetch each cart-only script and search for GST
    cartOnly.forEach(url => {
      https.get({
        hostname: 'foodhub-customer-web-ten.vercel.app',
        path: url,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, res2 => {
        let js = '';
        res2.on('data', c => js += c.toString());
        res2.on('end', () => {
          if (js.includes('GST') || js.includes('Platform Fee') || js.includes('Bill Summary')) {
            console.log(`\n=== ${url} CONTAINS PRICING CODE ===`);
            
            const idx = js.indexOf('Platform Fee');
            if (idx > -1) {
              console.log('\nPlatform Fee:');
              console.log(js.substring(Math.max(0, idx - 200), idx + 300));
            }
            const gidx = js.indexOf('GST');
            if (gidx > -1) {
              console.log('\nGST:');
              console.log(js.substring(Math.max(0, gidx - 200), gidx + 300));
            }
          }
        });
      });
    });
  });
});
