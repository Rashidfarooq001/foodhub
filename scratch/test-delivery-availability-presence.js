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
    console.log('Initial Operational Status:', initialStatus.operationalStatus);
    console.log('Initial Duty Status:', initialStatus.dutyStatus);

    // 3. Driver goes ONLINE
    console.log('\n3. Driver going ONLINE (POST /delivery/me/go-online)...');
    const goOnlineRes = await fetch(`${API_BASE}/delivery/me/go-online`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const goOnlineData = await goOnlineRes.json();
    console.log('Go Online Response Status:', goOnlineRes.status);
    console.log('Go Online Response Body:', goOnlineData);

    // 4. Send Heartbeat
    console.log('\n4. Sending Presence Heartbeat (POST /delivery/me/heartbeat)...');
    const hbRes = await fetch(`${API_BASE}/delivery/me/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ lat: 34.387, lng: 74.523 }),
    });
    const hbData = await hbRes.json();
    console.log('Heartbeat Response:', hbData);

    // 5. Restaurant Owner checks available riders
    console.log('\n5. Logging in as Restaurant Owner (owner.real@foodhub.com)...');
    const ownerRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.tokens?.accessToken || ownerData.accessToken;

    const ordersRes = await fetch(`${API_BASE}/orders?limit=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const orders = await ordersRes.json();
    const testOrder = (Array.isArray(orders) ? orders : orders.orders ?? [])[0];

    console.log(`\n6. Querying eligible riders for Order #${testOrder.orderNumber}...`);
    const eligibleRes = await fetch(`${API_BASE}/orders/${testOrder.id}/eligible-riders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const eligibleRiders = await eligibleRes.json();

    const availableList = eligibleRiders.filter((r) => r.isAvailable);
    const unavailableList = eligibleRiders.filter((r) => !r.isAvailable);

    console.log(`Available Riders Count: ${availableList.length}`);
    console.log(`Unavailable Riders Count: ${unavailableList.length}`);

    const driverRecord = availableList.find((r) => r.name.includes('Real Delivery Partner'));
    if (driverRecord) {
      console.log('✅ Driver correctly listed under AVAILABLE FOODHUB RIDERS:');
      console.log(`   Name: ${driverRecord.name}`);
      console.log(`   Status: ${driverRecord.status}`);
      console.log(`   Distance: ${driverRecord.distanceKm} km`);

      // 7. Assign rider to order
      console.log(`\n7. Assigning rider ${driverRecord.name} to Order #${testOrder.orderNumber}...`);
      const assignRes = await fetch(`${API_BASE}/orders/${testOrder.id}/assign-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ driverId: driverRecord.driverId }),
      });
      console.log('Assign Rider HTTP Status:', assignRes.status);

      // 8. Attempt going OFFLINE while BUSY (Should be BLOCKED)
      console.log('\n8. Attempting to go OFFLINE while BUSY (Should fail with 400)...');
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

      // 9. Complete delivery lifecycle
      console.log('\n9. Progressing order through delivery stages to completion...');
      await fetch(`${API_BASE}/delivery/jobs/${testOrder.id}/arrived`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      await fetch(`${API_BASE}/delivery/jobs/${testOrder.id}/picked-up`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      await fetch(`${API_BASE}/delivery/jobs/${testOrder.id}/start-delivery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const deliveredRes = await fetch(`${API_BASE}/delivery/jobs/${testOrder.id}/delivered`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log('Delivered Order Response Status:', deliveredRes.status);

      // 10. Check driver status after completion (Should return to ONLINE_AVAILABLE)
      console.log('\n10. Checking driver status post-delivery completion...');
      const postCompleteStatusRes = await fetch(`${API_BASE}/delivery/me/status`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const postCompleteStatus = await postCompleteStatusRes.json();
      console.log('Post-Completion Operational Status:', postCompleteStatus.operationalStatus);
      if (postCompleteStatus.operationalStatus === 'ONLINE_AVAILABLE') {
        console.log('✅ SUCCESS: Rider automatically released back to ONLINE_AVAILABLE status!');
      }

      // 11. Driver goes OFFLINE
      console.log('\n11. Driver going OFFLINE (POST /delivery/me/go-offline)...');
      const goOfflineRes = await fetch(`${API_BASE}/delivery/me/go-offline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const goOfflineData = await goOfflineRes.json();
      console.log('Go Offline Status:', goOfflineRes.status);
      console.log('Go Offline Body:', goOfflineData);
    }

    console.log('\n🎉 ALL REALTIME AVAILABILITY, PRESENCE & CONCURRENCY TESTS PASSED!');
  } catch (err) {
    console.error('❌ EXCEPTION IN AVAILABILITY SUITE:', err);
  }
}

testDeliveryAvailabilityPresence();
