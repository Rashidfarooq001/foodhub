const fs = require('fs');

const clientPath = 'apps/customer-web/src/app/client.tsx';
let code = fs.readFileSync(clientPath, 'utf8');

// Find the start and end of ROW 6
const row6Start = code.indexOf('ROW 6: RECOMMENDED FOR YOU');
if (row6Start === -1) {
  console.error('ROW 6 not found');
  process.exit(1);
}

const row7Start = code.indexOf('ROW 7: POPULAR RESTAURANTS');
if (row7Start === -1) {
  console.error('ROW 7 not found');
  process.exit(1);
}

// Get exactly the comment start
const startIdx = code.lastIndexOf('{/*', row6Start);
const endIdx = code.lastIndexOf('{/*', row7Start);

const recommendedJsx = `
            <section className="space-y-3 pt-2 mt-8 md:mt-10">
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
              )}
            </section>
`;

code = code.substring(0, startIdx) + '{/* ROW 6: RECOMMENDED FOR YOU */}\n' + recommendedJsx + '\n            ' + code.substring(endIdx);

fs.writeFileSync(clientPath, code, 'utf8');
console.log('Successfully replaced Row 6 HTML.');
