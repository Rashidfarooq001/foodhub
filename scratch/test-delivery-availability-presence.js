const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function testDeliveryAvailabilityPresence() {
  console.log('=== REAL FOODHUB DELIVERY PARTNER AVAILABILITY & PRESENCE E2E SUITE ===\n');

  try {
    // 1. Log in as Delivery Partner (driver.real@foodhub.com)
    console.log('1. Logging in as Delivery Partner (driver.real@foodhub.com)...');
    const driverRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });
    const driverData = await driverRes.json();
    const driverToken = driverData.tokens?.accessToken || driverData.accessToken;
    console.log('✅ Delivery Partner Logged In.');

    // 2. Query initial status
    console.log('\n2. Fetching GET /delivery/me/status...');
    const statusRes = await fetch(`${API_BASE}/delivery/me/status`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    console.log('Status HTTP Code:', statusRes.status);
    const statusText = await statusRes.text();
    console.log('Status Body Raw:', statusText);

    // 3. Driver goes ONLINE
    console.log('\n3. Driver going ONLINE (POST /delivery/me/go-online)...');
    const goOnlineRes = await fetch(`${API_BASE}/delivery/me/go-online`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    console.log('Go Online HTTP Status:', goOnlineRes.status);
    const goOnlineRaw = await goOnlineRes.text();
    console.log('Go Online Body Raw:', goOnlineRaw);
  } catch (err) {
    console.error('❌ EXCEPTION IN AVAILABILITY SUITE:', err);
  }
}

testDeliveryAvailabilityPresence();
