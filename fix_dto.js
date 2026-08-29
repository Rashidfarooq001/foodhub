const fs = require('fs');

let code = fs.readFileSync('apps/backend/src/modules/pricing/pricing.service.ts', 'utf8');

// Modify the DTO
code = code.replace(
  'paymentGatewayPlanningRate: number;',
  'paymentGatewayPlanningRate: number;\n  foodGstRate?: number;\n  platformBrandTitle?: string;'
);

code = code.replace(
  'paymentGatewayPlanningRate: 2.0,',
  "paymentGatewayPlanningRate: 2.0,\n  foodGstRate: 5.0,\n  platformBrandTitle: 'ZaykaFood',"
);

fs.writeFileSync('apps/backend/src/modules/pricing/pricing.service.ts', code);
console.log('Modified DTO in pricing.service.ts');
