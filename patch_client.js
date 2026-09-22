const fs = require('fs');
const file = 'apps/customer-web/src/app/restaurant/[slug]/client.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [selectedCategory, setSelectedCategory] = useState('All');",
  "const [selectedCategory, setSelectedCategory] = useState('All');\n  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);"
);

const fab = `
      {/* MENU SHORTCUT FAB */}
      <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setIsMenuModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-black text-white shadow-2xl shadow-gray-900/40 hover:bg-black transition active:scale-95 border border-gray-700"
        >
          <UtensilsCrossed className="h-4 w-4" />
          MENU
        </button>
      </div>
`;

content = content.replace("{/* STICKY FLOATING CART BAR */}", fab + "\n\n      {/* STICKY FLOATING CART BAR */}");

const modal = `
      {/* FULL SCREEN MENU MODAL */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white overflow-hidden animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <img src={getImageUrl(restaurant.logoUrl || restaurant.bannerUrl)} alt={restaurant.name} className="h-10 w-10 rounded-full object-cover border border-gray-100" />
              <div>
                <h2 className="text-sm font-black text-gray-900">{restaurant.name}</h2>
                <p className="text-[10px] text-gray-500">Full Menu</p>
              </div>
            </div>
            <button onClick={() => setIsMenuModalOpen(false)} className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-3 space-y-4 pb-32">
            <section className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
              <button
                type="button"
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={\`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-black border transition \${isVegOnly ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}\`}
              >
                <span className={\`h-2 w-2 rounded-full \${isVegOnly ? 'bg-emerald-600 ring-1 ring-emerald-600' : 'bg-gray-400'}\`} />
                Veg Only
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={\`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition \${selectedCategory === cat ? 'bg-rose-600 text-white font-black shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}\`}
                >
                  {cat}
                </button>
              ))}
            </section>

            <section>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredItems.map((food) => (
                  <FoodCard key={food.id} food={food} onCustomize={(f) => openCustomization(f)} restaurantClosed={restaurant.isCurrentlyOpen === false} />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
`;

content = content.replace("{/* CUSTOMIZATION BOTTOM SHEET */}", modal + "\n\n      {/* CUSTOMIZATION BOTTOM SHEET */}");

fs.writeFileSync(file, content);
console.log('Patched correctly');
