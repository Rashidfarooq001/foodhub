const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function testRenderEndpoints() {
  console.log('=== TESTING RENDER BACKEND RESPONSES & EXCEPTION HANDLERS ===\n');

  // 1. Health check
  console.log('1. Testing GET /health...');
  try {
    const healthRes = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
    console.log('GET /health status:', healthRes.status, await healthRes.text());
  } catch (e) {
    console.log('GET /health error:', e.message);
  }

  // 2. Auth login
  console.log('\n2. Logging in as owner.real@foodhub.com...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  const token = loginData.tokens?.accessToken || loginData.accessToken;

  // 3. Fetch Orders
  console.log('\n3. Fetching orders GET /orders...');
  const ordersRes = await fetch(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET /orders status:', ordersRes.status);
  const ordersData = await ordersRes.json();
  const rawList = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? [];
  console.log(`Found ${rawList.length} orders.`);
  if (rawList.length > 0) {
    console.log('Sample Order:', { id: rawList[0].id, orderNumber: rawList[0].orderNumber, status: rawList[0].status });
  }

  // 4. Test POST /orders/:id/accept
  if (rawList.length > 0) {
    const targetOrder = rawList.find((o) => o.status === 'PENDING') || rawList[0];
    console.log(`\n4. Sending POST /orders/${targetOrder.id}/accept...`);
    const acceptRes = await fetch(`${API_BASE}/orders/${targetOrder.id}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('POST /accept status code:', acceptRes.status);
    console.log('POST /accept response text:', await acceptRes.text());
  }
}

testRenderEndpoints().catch(console.error);
