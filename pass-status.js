const fs = require('fs');
const path = 'apps/customer-web/src/app/orders/[id]/track/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('driverName={driverName}', 'driverName={driverName}\n              orderStatus={order.status}');

fs.writeFileSync(path, content, 'utf8');
