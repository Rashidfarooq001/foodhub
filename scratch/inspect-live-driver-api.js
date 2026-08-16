const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function inspectLiveDriverAPI() {
  console.log('=== INSPECTING LIVE BACKEND DRIVER ENDPOINTS & STATUS ===\n');

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

    // Fetch order
    const ordersRes = await fetch(`${API_BASE}/orders?limit=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const orders = await ordersRes.json();
    const testOrder = (Array.isArray(orders) ? orders : orders.orders ?? [])[0];

    if (testOrder) {
      console.log(`Checking eligible riders for Order #${testOrder.orderNumber}...`);
      const eligibleRes = await fetch(`${API_BASE}/orders/${testOrder.id}/eligible-riders`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      console.log(`Eligible Riders Response Status: ${eligibleRes.status}`);
      const riders = await eligibleRes.json();
      console.log('Returned Riders Array:', JSON.stringify(riders, null, 2));
    }

    // 2. Log in as Delivery Partner
    console.log('\n2. Logging in as Delivery Partner (driver.real@foodhub.com)...');
    const driverRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });
    const driverData = await driverRes.json();
    const driverToken = driverData.tokens?.accessToken || driverData.accessToken;

    if (driverToken) {
      console.log('Driver logged in successfully.');
      const statsRes = await fetch(`${API_BASE}/delivery/stats`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      const stats = await statsRes.json();
      console.log('Driver Stats from DB:', JSON.stringify(stats, null, 2));
    }
  } catch (err) {
    console.error('Error inspecting live driver API:', err);
  }
}

inspectLiveDriverAPI();
