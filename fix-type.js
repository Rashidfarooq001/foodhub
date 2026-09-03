const fs = require('fs');
const file = 'apps/delivery-dashboard/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/catch \(e\)/g, "catch (e: any)");
content = content.replace(/catch\(e =>/g, "catch((e: any) =>");

fs.writeFileSync(file, content);
