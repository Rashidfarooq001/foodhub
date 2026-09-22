const fs = require('fs');

const clientPath = 'apps/customer-web/src/app/client.tsx';
let code = fs.readFileSync(clientPath, 'utf8');

// Add imports
code = code.replace(
  `import { RecommendedCard } from '../components/home/RecommendedCard';`,
  `import { RecommendedCard } from '../components/home/RecommendedCard';\nimport { RecommendedFoodCard } from '../components/home/RecommendedFoodCard';\nimport { useRouter } from 'next/navigation';`
);

// Add state and fetch for recommendations
const hooksCode = `
  const router = useRouter();
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

code = code.replace(
  `const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);`,
  `const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);\n${hooksCode}`
);

// Replace the JSX for RECOMMENDED FOR YOU
const recommendedJsx = `
                <div className="flex items-center justify-between">
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-600">
                    RECOMMENDED FOR YOU
                  </h2>
                  {!isRecLoading && (
                    <span className="text-[11px] font-bold text-gray-400">
                      {recommendations.length} items
                    </span>
                  )}
                </div>
  
                {isRecLoading ? (
                  <div className="flex overflow-x-auto gap-3 sm:gap-4 snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="snap-start w-[180px] sm:w-[220px] aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse shrink-0"
                      />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="flex overflow-x-auto gap-3 sm:gap-4 snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {recommendations.map((food) => (
                      <div key={food.id} className="snap-start w-[160px] sm:w-[200px] shrink-0">
                        <RecommendedFoodCard
                          food={food}
                          onCustomize={(f) => router.push(\`/restaurant/\${f.restaurantId}\`)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-center space-y-2">
                    <p className="text-xs sm:text-sm font-bold text-gray-700">
                      No recommendations right now.
                    </p>
                  </div>
                )
`;

// This regex replaces everything between the ROW 6 comment and the ROW 7 comment
code = code.replace(
  /\{\/\* 🍽️ ROW 6: RECOMMENDED FOR YOU \(DYNAMIC\) 🍽️ \*\/\}[\s\S]*?(?=\{\/\* 🏆 ROW 7: POPULAR RESTAURANTS)/,
  `{/* 🍽️ ROW 6: RECOMMENDED FOR YOU (DYNAMIC) 🍽️ */}\n            <section className="space-y-3 pt-2 mt-8 md:mt-10">\n${recommendedJsx}\n            </section>\n\n            `
);

// We need to fix the `recommendedList` variable which was `filteredRestaurants.slice(0, 6);`
// It is no longer used for rendering, so we can just remove it or ignore it.
fs.writeFileSync(clientPath, code, 'utf8');
console.log('Frontend patched.');
