const fs = require('fs');
let file = 'apps/customer-web/src/app/forgot-password/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Replace the secret auth key with the safe widgetId
txt = txt.replace(
  /'556022AwCmehfIN6a6dc465P1'/g,
  "widgetId"
);

fs.writeFileSync(file, txt);
console.log('Frontend secured by removing secret key!');
