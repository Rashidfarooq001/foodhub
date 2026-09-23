const fs = require('fs');
const file = 'apps/customer-web/src/app/login/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /router\.push\(redirectUrl\);/,
  "window.location.href = redirectUrl;"
);

fs.writeFileSync(file, content);
console.log('Fixed login redirect');
