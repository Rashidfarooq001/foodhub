const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function testAcceptDetails() {
  console.log('=== DETAILED TRACE OF ACCEPT ORDER HTTP 500 ===\n');

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.tokens?.accessToken || loginData.accessToken;
  console.log('Login response user:', JSON.stringify(loginData.user, null, 2));

  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET /auth/me status:', meRes.status);
  const meData = await meRes.json();
  console.log('GET /auth/me payload:', JSON.stringify(meData, null, 2));

  // Fetch Order
  const orderRes = await fetch(`${API_BASE}/orders/eaf99d39-d299-4694-b947-a920684a82a6`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('\nGET /orders/:id status:', orderRes.status);
  const orderData = await orderRes.json();
  console.log('Order restaurantId:', orderData.restaurantId);
  console.log('Order status:', orderData.status);

  // Send accept request
  const acceptRes = await fetch(`${API_BASE}/orders/eaf99d39-d299-4694-b947-a920684a82a6/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  console.log('\nPOST /orders/:id/accept status:', acceptRes.status);
  console.log('Response body:', await acceptRes.text());
}

testAcceptDetails().catch(console.error);
