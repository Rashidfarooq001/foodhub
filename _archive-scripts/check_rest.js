const https = require('https');

https.get('https://foodhub-backend-enq2.onrender.com/api/v1/restaurants', (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const restaurants = JSON.parse(data);
    const rest = restaurants.find((r) => r.id === '0591d52e-8515-4cf7-9c4c-e0f9133bc916');
    console.log(rest.name, rest.latitude, rest.longitude);
  });
});
