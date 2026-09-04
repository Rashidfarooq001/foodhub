const fs = require('fs');
let c = fs.readFileSync('apps/customer-web/src/app/client.tsx', 'utf8');

// Replace export default function CustomerHomePage() {
c = c.replace('export default function CustomerHomePage() {', 'export default function CustomerHomePage({ initialRestaurants = [] }: { initialRestaurants?: any[] }) {');

// Change const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
c = c.replace('const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);', 'const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants);');

// Make fetchRestaurants not show loading spinner if we have initial data (it already does this: if (restaurants.length === 0) setIsLoading(true))

fs.writeFileSync('apps/customer-web/src/app/client.tsx', c);
