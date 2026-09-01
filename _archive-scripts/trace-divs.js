const fs = require('fs');
const content = fs.readFileSync('apps/customer-web/src/app/page.tsx', 'utf8');

const match = content.match(/ROW 6: RECOMMENDED FOR YOU[\s\S]*?Location Selection Modal/);
if (match) {
  console.log(match[0].substring(match[0].length - 500));
}
