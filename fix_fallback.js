const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Find tax extraction
  code = code.replace(
    'const tax = orderQuote ? orderQuote.totalCustomerTaxes : 0;',
    'const tax = orderQuote?.totalCustomerTaxes ?? 0;'
  );

  fs.writeFileSync(filePath, code, 'utf8');
}

fixFile('apps/customer-web/src/app/checkout/page.tsx');
