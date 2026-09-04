const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

content = content.replace(
  /if \(Array\.isArray\(menuData\) && menuData\.length > 0\) \{\s*\/\/ Find a category with items\s*let allItems: any\[\] = \[\];\s*menuData\.forEach\(cat => \{\s*if \(cat\.items && Array\.isArray\(cat\.items\)\) \{\s*allItems\.push\(\.\.\.cat\.items\);\s*\}\s*\}\);\s*\/\/ Try to filter recommended, else just take 3\s*let recs: any\[\] = allItems\.filter\(i => i\.isRecommended \|\| i\.isBestseller\);\s*if \(recs\.length === 0\) recs = allItems;\s*\/\/ Filter out what is already in cart\s*const cartIds = new Set\(items\.map\(i => i\.id\)\);\s*recs = recs\.filter\(i => !cartIds\.has\(i\.id\)\);\s*setRecommendedItems\(recs\.slice\(0, 3\)\);\s*\}/m,
  `if (Array.isArray(menuData) && menuData.length > 0) {
              let allItems = menuData;
              let recs = allItems.filter(i => i.isRecommended || i.isBestseller);
              if (recs.length === 0) recs = allItems;
              const cartIds = new Set(items.map(i => i.foodItemId || i.id));
              recs = recs.filter(i => !cartIds.has(i.id));
              setRecommendedItems(recs.slice(0, 3));
            }`
);

fs.writeFileSync(checkoutPath, content, 'utf8');
