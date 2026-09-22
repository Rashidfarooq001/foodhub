const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/settlements/restaurant/1252fbbb-0ddc-4642-8962-abfd6856625d/invoice?periodType=current',
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' + (process.env.ADMIN_TOKEN || '') }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.on('error', console.error);
req.end();
