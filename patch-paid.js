const fs = require('fs');

function replaceInFile(file, replacer) {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content, 'utf8');
}

// 1. fix payments.service.ts
replaceInFile('apps/backend/src/modules/payments/payments.service.ts', (c) => {
  let nc = c.replace(/select: { restaurantId: true, paidAmount: true,/g, "select: { restaurantId: true, netPayable: true, status: true,");
  nc = nc.replace(/const totalRestaurantSettled = settlements\.reduce\(\(sum, s\) => sum \+ Number\(s\.paidAmount \|\| 0\), 0\);/g, "const totalRestaurantSettled = settlements.reduce((sum, s) => sum + (s.status === 'PAID' ? Number(s.netPayable || 0) : 0), 0);");
  return nc;
});

// 2. fix analytics.service.ts
replaceInFile('apps/backend/src/modules/analytics/analytics.service.ts', (c) => {
  return c.replace(/Number\(s\.paidAmount \|\| s\.netPayable \|\| 0\)/g, "Number(s.netPayable || 0)");
});

// 3. fix settlements.service.spec.ts
replaceInFile('apps/backend/src/modules/settlements/settlements.service.spec.ts', (c) => {
  return c.replace(/SettlementStatus\.SETTLED/g, "'PAID'");
});

// 4. delete check-orders.ts
if (fs.existsSync('apps/backend/check-orders.ts')) {
  fs.unlinkSync('apps/backend/check-orders.ts');
}

console.log("Patched paidAmount issues.");
