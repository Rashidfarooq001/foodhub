const https = require('https');

function loginAdmin() {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.accessToken);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.write(JSON.stringify({ email: 'admin@foodhub.com', password: 'password123' }));
    req.end();
  });
}

function updateGst(token, rate) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/pricing/config',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      },
    );
    req.write(JSON.stringify({ foodGstRate: rate }));
    req.end();
  });
}

function fetchQuote(restaurantId, lat, lng) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'foodhub-backend-enq2.onrender.com',
        port: 443,
        path: '/api/v1/orders/quote',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.write(
      JSON.stringify({
        restaurantId,
        latitude: lat,
        longitude: lng,
        foodSubtotal: 150,
        locationSource: 'MANUAL_GEOCODED',
      }),
    );
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in as admin...');
    const token = await loginAdmin();

    console.log('Fetching restaurant...');
    const resReq = await new Promise((r) => {
      https.get('https://foodhub-backend-enq2.onrender.com/api/v1/restaurants', (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => r(JSON.parse(d)));
      });
    });
    const rest = resReq[0];
    const lat = rest.latitude + 0.01;
    const lng = rest.longitude + 0.01;

    console.log('\n--- TEST 1: GST 7% ---');
    await updateGst(token, 7);
    const quote7 = await fetchQuote(rest.id, lat, lng);
    console.log(`GST (totalCustomerTaxes): ${quote7.totalCustomerTaxes}`);
    console.log(`Total: ${quote7.customerTotal}`);

    console.log('\n--- TEST 2: GST 9% ---');
    await updateGst(token, 9);
    const quote9 = await fetchQuote(rest.id, lat, lng);
    console.log(`GST (totalCustomerTaxes): ${quote9.totalCustomerTaxes}`);
    console.log(`Total: ${quote9.customerTotal}`);

    console.log('\n--- TEST 3: GST 0% ---');
    await updateGst(token, 0);
    const quote0 = await fetchQuote(rest.id, lat, lng);
    console.log(`GST (totalCustomerTaxes): ${quote0.totalCustomerTaxes}`);
    console.log(`Total: ${quote0.customerTotal}`);

    // Put back to 7%
    await updateGst(token, 7);
    console.log('\nTests complete.');
  } catch (e) {
    console.error(e);
  }
}
run();
