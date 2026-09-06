const fs = require('fs');

const mockDataPath = 'apps/customer-web/src/data/mock-data.ts';
let content = fs.readFileSync(mockDataPath, 'utf8');

const regex = /isOpen: r\.isOpen \?\? true,/g;
content = content.replace(regex, `isOpen: r.isOpen ?? true,
    isCurrentlyOpen: r.isCurrentlyOpen,
    isManuallyOffline: r.isManuallyOffline,
    nextOpeningTime: r.nextOpeningTime,`);

fs.writeFileSync(mockDataPath, content);
console.log('Fixed mock-data.ts');
