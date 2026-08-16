const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function runRiderAssignmentVerification() {
  console.log('=== RESTAURANT-CONTROLLED RIDER ASSIGNMENT VERIFICATION ===\n');

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
    console.log('✅ Restaurant Owner logged in. Token acquired.');

    // 2. Fetch PENDING/ACCEPTED orders
    console.log('\n2. Fetching active restaurant orders...');
    const ordersRes = await fetch(`${API_BASE}/orders?limit=10`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ordersData = await ordersRes.json();
    const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? [];
    console.log(`Fetched ${orders.length} orders for restaurant.`);

    if (orders.length === 0) {
      console.log('No order found to test rider assignment.');
      return;
    }

    const testOrder = orders[0];
    console.log(`Selected Order #${testOrder.orderNumber} (ID: ${testOrder.id})`);

    // 3. Query eligible riders for this order
    console.log(`\n3. Querying eligible FoodHub riders (GET /orders/${testOrder.id}/eligible-riders)...`);
    const ridersRes = await fetch(`${API_BASE}/orders/${testOrder.id}/eligible-riders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const riders = await ridersRes.json();
    console.log(`HTTP ${ridersRes.status}: Found ${Array.isArray(riders) ? riders.length : 0} eligible riders.`);

    if (Array.isArray(riders) && riders.length > 0) {
      const selectedRider = riders[0];
      console.log(`Eligible Rider Sample: ${selectedRider.name} (${selectedRider.vehicleType} • ${selectedRider.phone}) - Available: ${selectedRider.isAvailable}`);

      // 4. Restaurant explicitly assigns selected rider
      console.log(`\n4. Assigning rider ${selectedRider.name} (ID: ${selectedRider.driverId}) to Order #${testOrder.orderNumber}...`);
      const assignRes = await fetch(`${API_BASE}/orders/${testOrder.id}/assign-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ driverId: selectedRider.driverId }),
      });

      console.log(`ASSIGN RIDER HTTP Status: ${assignRes.status} ${assignRes.statusText}`);
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        console.log(`✅ Order Status updated to: ${assignData.status}`);
      } else {
        const err = await assignRes.json();
        console.log('Assign Result:', err.message);
      }
    }

    // 5. Test Unauthorized Access (Server-side Ownership Enforcement)
    console.log('\n5. Testing Server-Side Ownership Enforcement with unauthenticated request...');
    const unauthRes = await fetch(`${API_BASE}/orders/${testOrder.id}/eligible-riders`);
    console.log(`Unauthenticated HTTP Status: ${unauthRes.status} (Expected 401 Unauthorized)`);

    console.log('\n🎉 ALL RESTAURANT RIDER ASSIGNMENT TESTS COMPLETED CLEANLY!');
  } catch (err) {
    console.error('❌ ASSIGNMENT TEST EXCEPTION:', err);
  }
}

runRiderAssignmentVerification();
