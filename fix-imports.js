const fs = require('fs');
const path = require('path');

const drvCtrlPath = path.join('apps', 'backend', 'src', 'modules', 'drivers', 'drivers.controller.ts');
let drvCtrlCode = fs.readFileSync(drvCtrlPath, 'utf8');

if (!drvCtrlCode.includes('Query } from')) {
  drvCtrlCode = drvCtrlCode.replace(/import \{([^\}]+)\} from '@nestjs\/common';/, (match, p1) => {
    if (!p1.includes('Query')) {
      return `import {${p1}, Query } from '@nestjs/common';`;
    }
    return match;
  });
  fs.writeFileSync(drvCtrlPath, drvCtrlCode);
}

const restSvcPath = path.join('apps', 'backend', 'src', 'modules', 'restaurants', 'restaurants.service.ts');
let restSvcCode = fs.readFileSync(restSvcPath, 'utf8');
console.log('Rest SVC Signature:', restSvcCode.match(/findAllRestaurants\([^\)]*\)/)[0]);

