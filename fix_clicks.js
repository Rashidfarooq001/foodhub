const fs = require('fs');
const file = 'apps/customer-web/src/app/restaurant/[slug]/client.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix z-index
code = code.replace(
  'className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"',
  'className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"'
);

// Fix onClick
const oldOnClick = 'onClick={() => { if(isAvail) openCustomization(food); }}';
const newOnClick = `onClick={() => {
                              if (!isAvail) return;
                              const isCustomizable = (food.variants && food.variants.length > 0) || (food.addonGroups && food.addonGroups.length > 0);
                              if (isCustomizable) {
                                openCustomization(food);
                              } else {
                                addItem({
                                  foodItemId: food.id,
                                  name: food.name,
                                  price: food.price,
                                  imageUrl: food.imageUrl,
                                  isVeg: food.isVeg,
                                  restaurantId: restaurant.id,
                                  restaurantName: restaurant.name,
                                  addons: [],
                                });
                              }
                            }}`;

code = code.replace(oldOnClick, newOnClick);

fs.writeFileSync(file, code);
console.log('Fixed booklet click logic and bottom sheet z-index.');
