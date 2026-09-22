const fs = require('fs');

const path = 'apps/customer-web/src/app/checkout/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes('getImageUrl')) {
  code = code.replace(
    "import { getApiBaseUrl } from '@foodhub/config';",
    "import { getApiBaseUrl, getImageUrl } from '@foodhub/config';"
  );
  // Just in case it wasn't replaced
  if (!code.includes('getImageUrl')) {
     code = "import { getImageUrl } from '@foodhub/config';\n" + code;
  }
}

// Fix img src
code = code.replace(
  '<img src={item.imageUrl}',
  '<img src={getImageUrl(item.imageUrl)}'
);

// Second occurrence if any? Let's do regex
code = code.replace(/<img src=\{item\.imageUrl\}/g, '<img src={getImageUrl(item.imageUrl)}');

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed checkout page');
