const fs = require('fs');

const clientPath = 'apps/customer-web/src/app/client.tsx';
let clientCode = fs.readFileSync(clientPath, 'utf8');

// The replacement added 'import { useRouter } from 'next/navigation';'
// but it seems there was already one. Let's just remove the first one if there are duplicates.
const matches = [...clientCode.matchAll(/import \{ useRouter \} from 'next\/navigation';/g)];
if (matches.length > 1) {
  // Replace the second occurrence with empty string
  const lastMatch = matches[matches.length - 1];
  clientCode = clientCode.slice(0, lastMatch.index) + clientCode.slice(lastMatch.index + lastMatch[0].length);
  fs.writeFileSync(clientPath, clientCode, 'utf8');
  console.log('Fixed duplicate useRouter in client.tsx');
}

const cardPath = 'apps/customer-web/src/components/home/RecommendedFoodCard.tsx';
let cardCode = fs.readFileSync(cardPath, 'utf8');
cardCode = cardCode.replace(/addItem\(\{\n\s*id: food\.id,\n/g, 'addItem({\n');
cardCode = cardCode.replace(/price: Number\(food\.price\),\n\s*quantity: 1,\n\s*\}\)/g, 'price: Number(food.price)\n      })');
fs.writeFileSync(cardPath, cardCode, 'utf8');
console.log('Fixed addItem in RecommendedFoodCard.tsx');

