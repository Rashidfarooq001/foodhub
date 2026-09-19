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
  
  // 1. Check Settlement Overview
  await makeRequest('/settlements/restaurants?periodType=current', token);
}

function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.zaykafood.online/api/v1' + path, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`\n=== GET ${path} [${res.statusCode}] ===`);
          if (json.data) {
             const wular = json.data.find(r => r.restaurant.name.toLowerCase().includes('wular'));
             if (wular) console.log('Wular Front:', JSON.stringify(wular, null, 2));
             else console.log('Wular not found in overview');
          } else {
             console.log(JSON.stringify(json, null, 2));
          }
          resolve(json);
        } catch (e) {
          console.log('Parse error:', e.message, data.substring(0, 100));
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

main().catch(console.error).finally(() => p.$disconnect());
