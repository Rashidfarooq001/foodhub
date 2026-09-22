const fs = require('fs');
const file = 'apps/customer-web/src/app/restaurant/[slug]/client.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/className=\{lex gap-3 sm:gap-4/g, "className={`flex gap-3 sm:gap-4");
code = code.replace(/span className=\{absolute -top-1.5/g, "span className={`absolute -top-1.5");
fs.writeFileSync(file, code);
