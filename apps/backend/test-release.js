const jwt = require('jsonwebtoken');

// Muneeb User ID
const userId = 'db9ce56f-17ad-4811-b956-2b0ea0a938b8';
const payload = {
  sub: userId,
  phone: '+919876543211',
  role: 'DELIVERY_PARTNER'
};

const secret = 'super-secret-jwt-key-foodhub-2026-enterprise';
const token = jwt.sign(payload, secret);

const jobId = '80501344-1f08-4288-acab-d2b4f12edd13';

async function run() {
  console.log("Sending POST to unassign job...");
  const res = await fetch(`https://foodhub-backend-enq2.onrender.com/api/v1/delivery/jobs/${jobId}/unassign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

run().catch(console.error);
