const fs = require('fs');
const file = 'packages/api-client/tsconfig.json';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/"moduleResolution": "NodeNext"/, '"moduleResolution": "bundler"');
content = content.replace(/"module": "NodeNext"/, '"module": "esnext"');
fs.writeFileSync(file, content, 'utf8');
console.log('Updated tsconfig');
