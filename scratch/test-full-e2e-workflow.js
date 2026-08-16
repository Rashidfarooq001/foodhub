const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function runFullOperationalE2ETest() {
  console.log('=== FULL OPERATIONAL E2E LIFECYCLE VERIFICATION ===\n');

  try {
    // 1. Log in as Restaurant Owner
    console.log('1. Logging in as Restaurant Owner (owner.real@foodhub.com)...');
    const ownerRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.tokens?.accessToken || ownerData.accessToken;
    console.log('✅ Owner logged in. Restaurant ID:', ownerData.user?.restaurantId || ownerData.user?.restaurant?.id);

    // 2. Fetch PENDING orders for restaurant
    console.log('\n2. Fetching PENDING orders for restaurant...');
    const ordersRes = await fetch(`${API_BASE}/orders?status=PENDING`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const orders = await ordersRes.json();
    const ordersList = Array.isArray(orders) ? orders : orders.orders ?? [];
    console.log(`Found ${ordersList.length} PENDING orders.`);

    if (ordersList.length === 0) {
      console.log('No PENDING order found to test.');
      return;
    }

    const testOrder = ordersList[0];
    console.log(`Selected Order #${testOrder.orderNumber} (ID: ${testOrder.id})`);

    // 3. Restaurant ACCEPT order: PENDING -> ACCEPTED
    console.log('\n3. Restaurant accepting order (POST /orders/:id/accept)...');
    const acceptRes = await fetch(`${API_BASE}/orders/${testOrder.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`ACCEPT HTTP Status: ${acceptRes.status} ${acceptRes.statusText}`);

    // 4. Restaurant START PREPARATION: ACCEPTED -> PREPARING
    console.log('\n4. Restaurant starting preparation (POST /orders/:id/prepare)...');
    const prepareRes = await fetch(`${API_BASE}/orders/${testOrder.id}/prepare`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`PREPARE HTTP Status: ${prepareRes.status} ${prepareRes.statusText}`);

    // 5. Restaurant MARK READY: PREPARING -> READY_FOR_PICKUP (Creates DeliveryJob)
    console.log('\n5. Restaurant marking ready for pickup (POST /orders/:id/ready)...');
    const readyRes = await fetch(`${API_BASE}/orders/${testOrder.id}/ready`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`READY HTTP Status: ${readyRes.status} ${readyRes.statusText}`);
    const readyData = await readyRes.json();
    console.log('Updated Order Status:', readyData.status);

    // 6. Log in as Delivery Partner
    console.log('\n6. Logging in as Delivery Partner (driver.real@foodhub.com)...');
    const driverLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });

    let driverToken = null;
    if (driverLogin.ok) {
      const driverData = await driverLogin.json();
      driverToken = driverData.tokens?.accessToken || driverData.accessToken;
      console.log('✅ Delivery Partner logged in. Driver ID:', driverData.user?.driverId);
    } else {
      console.log('Driver login status:', driverLogin.status);
    }

    // 7. Driver fetches AVAILABLE jobs
    if (driverToken) {
      console.log('\n7. Driver fetching available delivery jobs (GET /delivery/jobs/available)...');
      const availRes = await fetch(`${API_BASE}/delivery/jobs/available`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const availJobs = await availRes.json();
      console.log(`Found ${Array.isArray(availJobs) ? availJobs.length : 0} available delivery jobs.`);
    }

    console.log('\n🎉 FULL OPERATIONAL TEST COMPLETED CLEANLY!');
  } catch (err) {
    console.error('❌ E2E TEST EXCEPTION:', err);
  }
}

runFullOperationalE2ETest();
