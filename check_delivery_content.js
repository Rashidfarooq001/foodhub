const https = require('https');

https.get({
  hostname: 'foodhub-delivery-dashboard-k1y73xylj-rashid14.vercel.app',
  path: '/',
  headers: { 'User-Agent': 'node' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    if (d.includes('ZaykaFood') || d.includes('Customer') || d.includes('checkout')) {
      console.log('It is Customer Web!');
    } else if (d.includes('Delivery')) {
      console.log('It is Delivery Dashboard!');
    } else {
      console.log('Unknown app!');
    }
    console.log(d.substring(0, 500));
  });
});
