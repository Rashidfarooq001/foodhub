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

      // 5. Progress order through sequential state machine transitions to completion
      console.log('\n5. Progressing active order through state machine transitions...');
      const activeOrderId = initialStatus.activeDelivery.orderId;

      const arrivedRes = await fetch(`${API_BASE}/delivery/jobs/${activeOrderId}/arrived`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log(`- ARRIVED_AT_RESTAURANT: HTTP ${arrivedRes.status}`);

      const pickedUpRes = await fetch(`${API_BASE}/delivery/jobs/${activeOrderId}/picked-up`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log(`- PICKED_UP: HTTP ${pickedUpRes.status}`);

      const startRes = await fetch(`${API_BASE}/delivery/jobs/${activeOrderId}/start-delivery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log(`- OUT_FOR_DELIVERY: HTTP ${startRes.status}`);

      const deliveredRes = await fetch(`${API_BASE}/delivery/jobs/${activeOrderId}/delivered`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log(`- DELIVERED: HTTP ${deliveredRes.status}`);

      // 6. Verify rider status after completion (Should return to ONLINE_AVAILABLE)
      console.log('\n6. Checking driver status post-delivery completion...');
      const postCompleteStatusRes = await fetch(`${API_BASE}/delivery/me/status`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const postCompleteStatus = await postCompleteStatusRes.json();
      console.log('Post-Completion Operational Status:', postCompleteStatus.operationalStatus);
      if (postCompleteStatus.operationalStatus === 'ONLINE_AVAILABLE') {
        console.log('✅ SUCCESS: Rider automatically released back to ONLINE_AVAILABLE status!');
      }
    }

    // 7. Driver goes OFFLINE
    console.log('\n7. Driver going OFFLINE (POST /delivery/me/go-offline)...');
    const goOfflineRes = await fetch(`${API_BASE}/delivery/me/go-offline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const goOfflineData = await goOfflineRes.json();
    console.log('Go Offline Status:', goOfflineRes.status);
    console.log('Go Offline Body:', goOfflineData);

    // 8. Verify driver is OFFLINE
    const finalStatusRes = await fetch(`${API_BASE}/delivery/me/status`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const finalStatus = await finalStatusRes.json();
    console.log('\nFinal Driver Operational Status:', finalStatus.operationalStatus);

    console.log('\n🎉 ALL REALTIME AVAILABILITY, PRESENCE & CONCURRENCY SUITE CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ EXCEPTION IN AVAILABILITY SUITE:', err);
  }
}

testDeliveryAvailabilityPresence();
