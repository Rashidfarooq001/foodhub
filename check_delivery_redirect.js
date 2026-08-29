const https = require('https');

function fetch(url) {
  https.get(url, { headers: { 'User-Agent': 'node' } }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      let loc = res.headers.location;
      if (loc.startsWith('/')) loc = new URL(loc, url).href;
      console.log('Redirecting to:', loc);
      return fetch(loc);
    }
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('Title:', d.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]);
      if (d.includes('ZaykaFood') || d.includes('Checkout')) console.log('Found Customer Web keywords');
      else if (d.includes('Delivery')) console.log('Found Delivery keywords');
      else console.log('No obvious keywords');
    });
  });
}
fetch('https://foodhub-delivery-dashboard-k1y73xylj-rashid14.vercel.app');
