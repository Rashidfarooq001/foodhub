const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Replace the dummy auth key with the real one
txt = txt.replace(
  /'556022TLShucwZ86a6d8a7bP1'/g,
  "'556022AwCmehfIN6a6dc465P1'"
);

fs.writeFileSync(file, txt);
console.log('Frontend authkey updated!');
