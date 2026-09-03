const jwt = require('jsonwebtoken');
async function run() {
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-foodhub-2026-enterprise';
  const token = jwt.sign({ sub: 'db9ce56f-17ad-4811-b956-2b0ea0a938b8', phone: '+917006298796', role: 'DELIVERY_PARTNER', sessionId: 'test-forensic' }, secret, { expiresIn: '1h' });
  console.log('Calling production API...');
  const res = await fetch('https://foodhub-backend-enq2.onrender.com/api/v1/delivery/active-jobs', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('HTTP STATUS: ' + res.status);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch(e) { console.log('RAW (not JSON): ' + text.substring(0, 500)); return; }
  if (Array.isArray(parsed)) {
    console.log('RESPONSE TYPE: raw Array');
    console.log('RETURNED JOBS: ' + parsed.length);
    for (const j of parsed) {
      console.log('  ' + j.orderNumber + ' | jobStatus: ' + j.jobStatus + ' | status: ' + j.status);
    }
  } else if (parsed && parsed.data && Array.isArray(parsed.data)) {
    console.log('RESPONSE TYPE: { data: Array }');
    console.log('RETURNED JOBS: ' + parsed.data.length);
    for (const j of parsed.data) {
      console.log('  ' + j.orderNumber + ' | jobStatus: ' + j.jobStatus + ' | status: ' + j.status);
    }
  } else {
    console.log('RESPONSE TYPE: ' + typeof parsed);
    console.log('KEYS: ' + Object.keys(parsed).join(', '));
    console.log('RESPONSE: ' + text.substring(0, 500));
  }
}
run().catch(e => console.error(e.message));
