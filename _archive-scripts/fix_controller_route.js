const fs = require('fs');
let code = fs.readFileSync(
  'apps/backend/src/modules/geolocation/geolocation.controller.ts',
  'utf8',
);

code = code.replace(
  /@Controller\(\['geolocation', 'geo'\]\)/g,
  `@Controller(['geolocation', 'geo', 'location'])`,
);
code = code.replace(/@Post\(\['resolve', 'location\/resolve'\]\)/g, `@Post('resolve')`);
code = code.replace(/@Get\(\['resolve', 'location\/resolve'\]\)/g, `@Get('resolve')`);

fs.writeFileSync('apps/backend/src/modules/geolocation/geolocation.controller.ts', code);
console.log('Done');
