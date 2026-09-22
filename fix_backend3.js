const fs = require('fs');
const content = fs.readFileSync('apps/backend/src/modules/orders/orders.service.ts', 'utf8');
const newContent = content.replace(
  /UnauthorizedException,/g,
  'UnauthorizedException,\n  InternalServerErrorException,'
);
fs.writeFileSync('apps/backend/src/modules/orders/orders.service.ts', newContent);
