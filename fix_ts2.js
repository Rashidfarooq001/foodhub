const fs = require('fs');

const cardPath = 'apps/customer-web/src/components/home/RecommendedFoodCard.tsx';
let cardCode = fs.readFileSync(cardPath, 'utf8');

cardCode = cardCode.replace(
  'price: Number(food.price)',
  'price: Number(food.price),\n        isVeg: food.isVeg !== false,\n        addons: []'
);

fs.writeFileSync(cardPath, cardCode, 'utf8');
console.log('Fixed missing properties in addItem');
