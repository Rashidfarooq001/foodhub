const fs = require('fs');
const file = 'packages/utils/src/index.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\.js/g, '.ts');
fs.writeFileSync(file, content, 'utf8');
