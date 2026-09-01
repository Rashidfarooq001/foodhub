const fs = require('fs');
let code = fs.readFileSync('apps/backend/package.json', 'utf8');
code = code.replace(
  '"build": "prisma generate && npx prisma db push --accept-data-loss && nest build"',
  '"build": "prisma generate && nest build"',
);
fs.writeFileSync('apps/backend/package.json', code, 'utf8');
console.log('Fixed backend build script');
