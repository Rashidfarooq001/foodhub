const fs = require('fs');

const clientPath = 'apps/customer-web/src/app/client.tsx';
let code = fs.readFileSync(clientPath, 'utf8');

// Insert hooks right after `const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants);`
const searchStr = `const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants);`;

if (!code.includes(searchStr)) {
  console.error('Could not find restaurants state to inject hooks');
  process.exit(1);
}

const hooksCode = `
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isRecLoading, setIsRecLoading] = useState(true);
  
  const fetchRecommendations = useCallback(async () => {
    try {
      setIsRecLoading(true);
      const res = await fetch(\`\${API_BASE}/menus/recommendations\`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.data || data || []);
      }
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setIsRecLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);
`;

code = code.replace(searchStr, searchStr + '\n' + hooksCode);

fs.writeFileSync(clientPath, code, 'utf8');
console.log('Successfully added hooks to client.tsx');
