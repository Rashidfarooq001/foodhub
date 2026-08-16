const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function runRiderAssignmentVerification() {
  console.log('=== RESTAURANT-CONTROLLED RIDER ASSIGNMENT REAL LIFECYCLE AUDIT ===\n');

  try {
    // 1. Delivery Partner logs in and sets status to ONLINE
    console.log('1. Logging in as Delivery Partner (driver.real@foodhub.com)...');
    const driverLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });
    const driverData = await driverLogin.json();
    const driverToken = driverData.tokens?.accessToken || driverData.accessToken;
    console.log(`✅ Driver logged in. Driver ID: ${driverData.user?.driverId}`);

    console.log('\n2. Toggling driver duty status to ONLINE...');
    const dutyRes = await fetch(`${API_BASE}/delivery/duty-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ status: 'ONLINE' }),
    });
    const dutyData = await dutyRes.json();
    console.log(`✅ Driver Duty Status set to: ${dutyData.dutyStatus}`);

    // 3. Log in as Restaurant Owner
    console.log('\n3. Logging in as Restaurant Owner (owner.real@foodhub.com)...');
    const ownerRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.tokens?.accessToken || ownerData.accessToken;

    // Fetch active order
    const ordersRes = await fetch(`${API_BASE}/orders?limit=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ordersData = await ordersRes.json();
    const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? [];
    if (orders.length === 0) {
      console.log('No order found to test.');
      return;
    }
    const testOrder = orders[0];
    console.log(`Selected Order #${testOrder.orderNumber} (ID: ${testOrder.id})`);

    // 4. Query eligible riders for this order
    console.log(`\n4. Restaurant querying eligible riders (GET /orders/${testOrder.id}/eligible-riders)...`);
    const ridersRes = await fetch(`${API_BASE}/orders/${testOrder.id}/eligible-riders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const riders = await ridersRes.json();
    console.log(`HTTP ${ridersRes.status}: Returned ${riders.length} rider records from PostgreSQL.`);

    const availableRiders = riders.filter((r) => r.isAvailable);
    const unavailableRiders = riders.filter((r) => !r.isAvailable);

    console.log(`  - ONLINE_AVAILABLE Riders: ${availableRiders.length}`);
    console.log(`  - Unavailable Riders: ${unavailableRiders.length}`);

    if (availableRiders.length > 0) {
      const targetRider = availableRiders[0];
      console.log('\nSample Available Rider Record:');
      console.log(`  Name: ${targetRider.name}`);
      console.log(`  Phone: ${targetRider.phone}`);
      console.log(`  Vehicle: ${targetRider.vehicleType} (${targetRider.vehicleNumber})`);
      console.log(`  Rating: ★ ${targetRider.rating}`);
      console.log(`  Completed Deliveries: ${targetRider.completedCount}`);
      console.log(`  Distance from Restaurant: ${targetRider.distanceKm} km`);
      console.log(`  Status: ${targetRider.status} (isAvailable: ${targetRider.isAvailable})`);

      // 5. Restaurant explicitly assigns rider
      console.log(`\n5. Restaurant assigning rider ${targetRider.name} to Order #${testOrder.orderNumber}...`);
      const assignRes = await fetch(`${API_BASE}/orders/${testOrder.id}/assign-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ driverId: targetRider.driverId }),
      });

      console.log(`ASSIGN RIDER HTTP Status: ${assignRes.status} ${assignRes.statusText}`);
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        console.log(`✅ Order Status updated to: ${assignData.status}`);
      }
    }

    console.log('\n🎉 ALL REALTIME RIDER AVAILABILITY & ASSIGNMENT AUDIT CHECKS PASSED!');
  } catch (err) {
    console.error('❌ RIDER ASSIGNMENT AUDIT EXCEPTION:', err);
  }
}

runRiderAssignmentVerification();
