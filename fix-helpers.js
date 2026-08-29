const fs = require('fs');
const file = 'packages/api-client/src/index.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("export * from './helpers.js';", "export { getRequest, postRequest } from './helpers.js';");
fs.writeFileSync(file, content, 'utf8');
