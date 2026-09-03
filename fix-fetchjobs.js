const fs = require('fs');
const file = 'apps/delivery-dashboard/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/fetchJobs, /g, "");

fs.writeFileSync(file, content);
