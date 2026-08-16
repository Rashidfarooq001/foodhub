const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function testDriverOnlineToggle() {
  console.log('=== DRIVER DUTY STATUS TOGGLE VERIFICATION ===\n');

  try {
    console.log('1. Logging in as Delivery Partner (driver.real@foodhub.com)...');
    const driverRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });

    const driverData = await driverRes.json();
    const token = driverData.tokens?.accessToken || driverData.accessToken;
    console.log('Driver logged in. Status:', driverRes.status);

    console.log('\n2. Sending PATCH /delivery/duty-status with { status: "ONLINE" }...');
    const patchRes = await fetch(`${API_BASE}/delivery/duty-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'ONLINE' }),
    });

    console.log(`PATCH Response HTTP Status: ${patchRes.status} ${patchRes.statusText}`);
    const patchBody = await patchRes.json();
    console.log('PATCH Response Body:', JSON.stringify(patchBody, null, 2));

    console.log('\n3. Logging in as Restaurant Owner to verify rider eligibility list...');
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

    if (testOrder) {
      const eligibleRes = await fetch(`${API_BASE}/orders/${testOrder.id}/eligible-riders`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const riders = await eligibleRes.json();
      console.log('\nEligible Riders Response:');
      for (const r of riders) {
        console.log(`  - ${r.name} (${r.phone}): status=${r.status}, isAvailable=${r.isAvailable}, reason=${r.unavailabilityReason}`);
      }
    }
  } catch (err) {
    console.error('Error during driver online toggle test:', err);
  }
}

testDriverOnlineToggle();
