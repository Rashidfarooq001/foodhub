const fs = require('fs');

const recCardPath = 'apps/customer-web/src/components/home/RecommendedCard.tsx';
let content = fs.readFileSync(recCardPath, 'utf8');

const regex = /const isOpen = restaurant\.isOpen !== false;/g;
content = content.replace(regex, `const isOpen = restaurant.isCurrentlyOpen !== false;`);

fs.writeFileSync(recCardPath, content);
console.log('Fixed RecommendedCard.tsx');
