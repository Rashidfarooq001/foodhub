const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function checkRenderHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    console.log('Health Status:', res.status);
    const data = await res.text();
    console.log('Health Body:', data);
  } catch (err) {
    console.error('Render health check error:', err);
  }
}

checkRenderHealth();
