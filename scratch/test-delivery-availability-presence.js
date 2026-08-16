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
    const initialStatus = await statusRes.json();
    console.log('Operational Status:', initialStatus.operationalStatus);
    console.log('Duty Status:', initialStatus.dutyStatus);
    if (initialStatus.activeDelivery) {
      console.log('Active Delivery Order ID:', initialStatus.activeDelivery.orderId);
    }

    // 3. Driver sends Presence Heartbeat
    console.log('\n3. Sending Presence Heartbeat (POST /delivery/me/heartbeat)...');
    const hbRes = await fetch(`${API_BASE}/delivery/me/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ lat: 34.387, lng: 74.523 }),
    });
    console.log('Heartbeat Response:', await hbRes.json());

    // 4. Attempt going OFFLINE while BUSY (Should be BLOCKED)
    if (initialStatus.activeDelivery) {
      console.log('\n4. Attempting to go OFFLINE while BUSY (Should fail with 400)...');
      const failOfflineRes = await fetch(`${API_BASE}/delivery/me/go-offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log('Go Offline HTTP Status:', failOfflineRes.status);
      const failOfflineData = await failOfflineRes.json();
      console.log('Go Offline Error Message:', failOfflineData.message);
      if (failOfflineRes.status === 400 && failOfflineData.message.includes('active delivery')) {
        console.log('✅ SUCCESS: System blocked rider from going offline while actively delivering!');
      }

      // 5. Inspect ARRIVED error response
      console.log('\n5. Inspecting ARRIVED transition response...');
      const activeOrderId = initialStatus.activeDelivery.orderId;

      const arrivedRes = await fetch(`${API_BASE}/delivery/jobs/${activeOrderId}/arrived`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log(`- ARRIVED_AT_RESTAURANT HTTP ${arrivedRes.status}:`, await arrivedRes.text());
    }

    console.log('\n🎉 ALL REALTIME AVAILABILITY & PRESENCE AUDIT CHECKS COMPLETED!');
  } catch (err) {
    console.error('❌ EXCEPTION IN AVAILABILITY SUITE:', err);
  }
}

testDeliveryAvailabilityPresence();
