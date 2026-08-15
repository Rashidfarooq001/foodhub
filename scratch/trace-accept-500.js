const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function traceAccept500() {
  console.log('=== REPRODUCING & TRACING ACCEPT ORDER HTTP 500 ===\n');

  // 1. Login as Real Restaurant Owner
  console.log('1. Logging in as owner.real@foodhub.com...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.tokens?.accessToken || loginData.accessToken;
  console.log(`Owner logged in. User ID: ${loginData.user?.id}, Restaurant ID: ${loginData.user?.restaurant?.id}`);

  // 2. Fetch PENDING Orders
  console.log('\n2. Fetching PENDING orders for restaurant...');
  const ordersRes = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const orders = await ordersRes.json();
  const rawList = Array.isArray(orders) ? orders : orders.orders ?? [];
  console.log(`Found ${rawList.length} total orders.`);

  const pendingOrder = rawList.find((o) => o.status === 'PENDING') || rawList[0];
  if (!pendingOrder) {
    console.error('❌ No orders found on restaurant!');
    return;
  }
  console.log(`Target Order: ID=${pendingOrder.id}, OrderNumber=${pendingOrder.orderNumber}, Status=${pendingOrder.status}`);

  // 3. Send POST /orders/:id/accept
  console.log(`\n3. Sending POST /api/v1/orders/${pendingOrder.id}/accept...`);
  const acceptRes = await fetch(`${API_BASE}/orders/${pendingOrder.id}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`\n=== RESPONSE DETAILS ===`);
  console.log(`Status Code: ${acceptRes.status} ${acceptRes.statusText}`);
  console.log(`Headers:`, Object.fromEntries(acceptRes.headers.entries()));
  const bodyText = await acceptRes.text();
  console.log(`Response Body:\n${bodyText}`);
}

traceAccept500().catch(console.error);
