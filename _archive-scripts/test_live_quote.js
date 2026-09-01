const https = require('https');

https.get('https://foodhub-backend-enq2.onrender.com/api/v1/restaurants', (res) => {
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    const data = JSON.parse(body);
    const r = data[0];

    if (!r) return console.log('No restaurant');

    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/orders/quote',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res2) => {
        let body2 = '';
        res2.on('data', (c) => (body2 += c));
        res2.on('end', () => console.log('Quote result:', body2));
      },
    );

    req.write(
      JSON.stringify({
        restaurantId: r.id,
        latitude: r.latitude + 0.01,
        longitude: r.longitude + 0.01,
        foodSubtotal: 500,
        locationSource: 'MANUAL_GEOCODED',
      }),
    );
    req.end();
  });
});
