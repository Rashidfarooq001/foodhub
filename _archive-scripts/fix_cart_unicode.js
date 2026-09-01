const fs = require('fs');
let code = fs.readFileSync('apps/customer-web/src/app/cart/page.tsx', 'utf8');

code = code.replace(/<span>\?\{platformFee\}<\/span>/g, '<span>\u20B9{platformFee}</span>');
code = code.replace(/<span>\?\{tax\}<\/span>/g, '<span>\u20B9{tax}</span>');
code = code.replace(/<span>\?3<\/span>/g, '<span>\u20B93</span>');
code = code.replace(/<span>\?0<\/span>/g, '<span>\u20B90</span>');

fs.writeFileSync('apps/customer-web/src/app/cart/page.tsx', code, 'utf8');
console.log('Fixed cart page unicode');
