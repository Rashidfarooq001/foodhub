const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/<span>\\u20B9\{(.*?)\}<\/span>/g, '<span>&#x20B9;{$1}</span>');
  code = code.replace(/<span>\\u20B9(.*?)<\/span>/g, '<span>&#x20B9;$1</span>');
  
  // also fix if powershell dumped literal ? 
  code = code.replace(/<span>\?\{(.*?)\}<\/span>/g, '<span>&#x20B9;{$1}</span>');
  
  // also fix literal ₹ just in case
  code = code.replace(/<span>₹\{(.*?)\}<\/span>/g, '<span>&#x20B9;{$1}</span>');
  
  fs.writeFileSync(file, code, 'utf8');
}

fixFile('apps/customer-web/src/app/checkout/page.tsx');
fixFile('apps/customer-web/src/app/cart/page.tsx');
console.log('Fixed JSX with HTML entity');
