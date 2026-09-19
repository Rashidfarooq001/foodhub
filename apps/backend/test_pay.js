const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const https = require('https');

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const wular = await p.restaurant.findFirst({ where: { name: { contains: 'wular' } } });
  
  const token = jwt.sign(
    { sub: admin.id, phone: admin.phone, role: admin.role, sessionId: 'test-session' },
    'super-secret-jwt-key-foodhub-2026-enterprise',
    { expiresIn: '1d' }
  );
  p.$disconnect();
  
  console.log(`Testing PAY for restaurant ${wular.name} (${wular.id})...`);
  
  // 1. Get detail before pay
  const detail1 = await makeRequest(`/settlements/restaurant/${wular.id}/detail?periodType=current`, token);
  console.log('Before Pay - Status:', detail1.financialSummary?.status, 'Pending:', detail1.financialSummary?.pendingAmount);
  
  // 2. Pay
  const payRes = await makeRequest(`/settlements/restaurant/${wular.id}/record-payment`, token, 'POST', {
    amount: detail1.financialSummary?.pendingAmount,
    paymentMethod: 'MANUAL',
    transactionReference: 'MANUAL_TEST',
    periodType: 'current'
  });
  console.log('Pay Response:', payRes);
  
  // 3. Get detail after pay
  const detail2 = await makeRequest(`/settlements/restaurant/${wular.id}/detail?periodType=current`, token);
  console.log('After Pay - Status:', detail2.financialSummary?.status, 'Pending:', detail2.financialSummary?.pendingAmount, 'Invoice:', detail2.weeklySettlement?.invoiceNumber);
  
  // 4. Get invoice
  if (detail2.weeklySettlement?.invoiceNumber) {
    const inv = await makeRequest(`/settlements/restaurant/${wular.id}/invoice?periodType=current`, token);
    console.log('Invoice data:', inv);
  }
}

function makeRequest(path, token, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const opts = {
      method,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    };
    const req = https.request('https://api.zaykafood.online/api/v1' + path, opts, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', () => resolve(null));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

main();
