const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'test', 'master-e2e.ts');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/findAllRestaurants\(true, undefined, undefined\)/g, "findAllRestaurants(true, undefined, undefined, 1)");
  code = code.replace(/findAllRestaurants\(true\)/g, "findAllRestaurants(true, undefined, undefined, 1)");
  fs.writeFileSync(file, code);
}
