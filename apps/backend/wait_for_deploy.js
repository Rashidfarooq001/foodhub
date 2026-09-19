const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const https = require('https');

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) throw new Error('No admin found');
  const token = jwt.sign(
    { sub: admin.id, phone: admin.phone, role: admin.role, sessionId: 'test-session' },
    'super-secret-jwt-key-foodhub-2026-enterprise',
    { expiresIn: '1d' }
  );
  p.$disconnect();
  
  console.log("Waiting for new deployment to go live...");
  
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    console.log(`\nAttempt ${attempts}...`);
    makeRequest('/settlements/restaurants?periodType=current', token).then(json => {
      if (json && json.data) {
        const wular = json.data.find(r => r.restaurant.name.toLowerCase().includes('wular'));
        if (wular) {
          console.log(`Status: ${wular.status}, Pending: ${wular.pendingAmount}, commGst: ${wular.commissionGst}`);
          // The new code includes commissionGst in the response and changes status to PENDING if pendingAmount > 0
          if (wular.commissionGst !== undefined && wular.status === 'PENDING') {
            console.log("\n✅ DEPLOYMENT IS LIVE!");
            clearInterval(interval);
            process.exit(0);
          }
        }
      }
    });
    
    if (attempts >= 60) {
      console.log("Timeout waiting for deployment.");
      clearInterval(interval);
      process.exit(1);
    }
  }, 10000);
}

function makeRequest(path, token) {
  return new Promise((resolve) => {
    const req = https.request('https://api.zaykafood.online/api/v1' + path, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

main();
