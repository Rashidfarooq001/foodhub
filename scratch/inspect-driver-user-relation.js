const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function inspectDriverUserRelation() {
  console.log('=== INSPECTING DRIVER USER ACCOUNT & DRIVER MODEL RELATION ===\n');

  try {
    // 1. Log in as driver.real@foodhub.com
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });

    const data = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('User Object:', JSON.stringify(data.user, null, 2));

    // 2. Fetch /auth/me or user profile
    const token = data.tokens?.accessToken || data.accessToken;
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('/auth/me Status:', meRes.status);
    if (meRes.ok) {
      const meData = await meRes.json();
      console.log('/auth/me Body:', JSON.stringify(meData, null, 2));
    }
  } catch (err) {
    console.error('Error inspecting driver user relation:', err);
  }
}

inspectDriverUserRelation();
