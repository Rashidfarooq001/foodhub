const https = require('https');

// Search ALL chunks for cart page code
const chunks = [
  '1zlmk5jy41bf7', '24emi9qwr1pk-', '0q9i0yy7-b_oo', '2y8e9xht0pnl1',
  'turbopack-22q-ag7-1-tbr', '3z0o6g8tgcwqh', '0yjrphyvq5c5p', 
  '2d4dizjowzgj4', '13vrb70bwowk1', '3-n7qypmik7zb', 
  '2ttfstcplwvay', '0cz1d0mv5g_q7', '3th38hfydmvo6'
];

let done = 0;
chunks.forEach(chunk => {
  https.get({
    hostname: 'foodhub-customer-web-ten.vercel.app',
    path: `/_next/static/chunks/${chunk}.js`,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, res => {
    let js = '';
    res.on('data', c => js += c.toString());
    res.on('end', () => {
      done++;
      if (js.includes('Item Subtotal')) {
        console.log(`\n=== ${chunk}.js contains "Item Subtotal" ===`);
        const idx = js.indexOf('Item Subtotal');
        console.log(js.substring(Math.max(0, idx - 200), idx + 800));
      }
      if (js.includes('Bill Summary')) {
        console.log(`\n=== ${chunk}.js contains "Bill Summary" ===`);
        const idx = js.indexOf('Bill Summary');
        console.log(js.substring(Math.max(0, idx - 100), idx + 800));
      }
      if (done === chunks.length) console.log('\nDone scanning all chunks.');
    });
  }).on('error', () => { done++; });
});
