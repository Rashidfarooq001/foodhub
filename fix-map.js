const fs = require('fs');

const restServicePath = 'apps/backend/src/modules/restaurants/restaurants.service.ts';
let content = fs.readFileSync(restServicePath, 'utf8');

// Find the block:
// return {
//   ...restaurant,
//   distanceKm,
//   deliveryTimeMins,
const regex = /return \{\s*\.\.\.restaurant,\s*distanceKm,\s*deliveryTimeMins,/g;
content = content.replace(regex, `return {
          ...restaurant,
          ...getRestaurantAvailability(restaurant.timings || [], restaurant.isOpen),
          distanceKm,
          deliveryTimeMins,`);

fs.writeFileSync(restServicePath, content);
console.log('Fixed the second map block.');
