const fs = require('fs');
const file = 'packages/api-client/src/index.ts';
let content = fs.readFileSync(file, 'utf8');
content = '// TEST CACHE\n' + content;
fs.writeFileSync(file, content, 'utf8');
