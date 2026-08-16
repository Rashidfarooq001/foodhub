const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function traceProductionFailure() {
  console.log('=== END-TO-END INVESTIGATION OF PRODUCTION HTTP 500 ===\n');

  // 1. Log in as Real Restaurant Owner
  console.log('Step 1: Logging in as owner.real@foodhub.com...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
  });

  console.log('Login HTTP status:', loginRes.status);
  const loginData = await loginRes.json();
  const token = loginData.tokens?.accessToken || loginData.accessToken;
  console.log('Logged-in User:', {
    id: loginData.user?.id,
    role: loginData.user?.role,
    restaurantId: loginData.user?.restaurant?.id || loginData.user?.restaurantId,
  });

  // 2. Fetch GET /auth/me
  console.log('\nStep 2: Fetching GET /auth/me...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET /auth/me HTTP status:', meRes.status);
  const meData = await meRes.json();
  console.log('Authenticated Me:', {
    id: meData.id,
    role: meData.role,
    restaurantId: meData.restaurantId || meData.restaurant?.id,
  });

  // 3. Fetch Orders GET /orders
  console.log('\nStep 3: Fetching GET /orders...');
  const ordersRes = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET /orders HTTP status:', ordersRes.status);
  const ordersData = await ordersRes.json();
  const ordersList = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? [];
  console.log(`Total orders returned: ${ordersList.length}`);

  ordersList.forEach((o) => {
    console.log(`- Order #${o.orderNumber} (ID: ${o.id}): status=${o.status}, restaurantId=${o.restaurantId}`);
  });

  // 4. Test POST /orders/:id/accept on each PENDING order
  const pendingOrders = ordersList.filter((o) => o.status === 'PENDING');
  console.log(`\nFound ${pendingOrders.length} PENDING orders to test.`);

  for (const pendingOrder of pendingOrders) {
    console.log(`\nTesting POST /api/v1/orders/${pendingOrder.id}/accept for Order #${pendingOrder.orderNumber}...`);
    const acceptRes = await fetch(`${API_BASE}/orders/${pendingOrder.id}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status Code: ${acceptRes.status} ${acceptRes.statusText}`);
    const responseText = await acceptRes.text();
    console.log(`Response Body:\n${responseText}`);
  }
}

traceProductionFailure().catch(console.error);
