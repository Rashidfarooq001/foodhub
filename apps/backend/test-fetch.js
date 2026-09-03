const jwt = require('jsonwebtoken');
const token = jwt.sign({ sub: '5a22300b-251e-4afa-beff-b774de47afe2', role: 'SUPER_ADMIN' }, 'super-secret-jwt-key-foodhub-2026-enterprise', { expiresIn: '1h' });

async function run() {
  const res = await fetch('http://localhost:4000/api/v1/analytics/admin?range=7D', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
