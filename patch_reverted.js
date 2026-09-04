const fs = require('fs');
const checkoutPath = 'apps/customer-web/src/app/checkout/page.tsx';
let content = fs.readFileSync(checkoutPath, 'utf8');

// 1. Fix Price Breakdown Icon
content = content.replace(/<span>.*?<\/span>\s*Price Breakdown/g, '<Banknote className="w-5 h-5 text-gray-900" /> PRICE BREAKDOWN');

// 2. Fix Place Order Button Text
content = content.replace(/'PLACE ORDER [^']*'/g, "(<span className=\"flex items-center gap-1\">PLACE ORDER <ArrowRight className=\"w-4 h-4\" /></span>)");
content = content.replace(/'PROCEED TO PAYMENT [^']*'/g, "(<span className=\"flex items-center gap-1\">PROCEED TO PAYMENT <ArrowRight className=\"w-4 h-4\" /></span>)");

// 3. Fix Quantity Multiplier
content = content.replace(/\{item\.quantity\}[^<]*<\/span>/g, "{item.quantity}\u00D7\n                       </span>");

// 4. Reduce bottom padding
content = content.replace(/pb-28/g, "pb-24");

// 5. Fix fetchMenu logic
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
