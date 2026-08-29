const https = require('https');

// We need to fetch without redirects or fetch the production URL for delivery-dashboard
// If delivery-dashboard is serving customer-web, that explains everything!
const url = 'https://foodhub-delivery-dashboard.vercel.app';

https.get(url, { headers: { 'User-Agent': 'node' } }, res => {
  console.log('HTTP:', res.statusCode);
  if (res.headers.location) console.log('Location:', res.headers.location);
  
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Title:', d.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]);
    if (d.includes('ZaykaFood') || d.includes('checkout') || d.includes('Cart')) {
      console.log('!!! DELIVERY DASHBOARD IS SERVING CUSTOMER WEB !!!');
    }
  });
});
