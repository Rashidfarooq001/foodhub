const fs = require('fs');
const file = 'apps/customer-web/src/app/restaurant/[slug]/client.tsx';
let content = fs.readFileSync(file, 'utf8');

const modalOldPattern = /\{\/\* FULL SCREEN MENU MODAL \*\/\}[\s\S]*?\{\/\* CUSTOMIZATION BOTTOM SHEET \*\/\}/;

const modalNew = `
      {/* VISUAL BOOKLET MENU MODAL */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#FFFBF0] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col border-[6px] sm:border-[12px] border-[#FFFBF0] outline outline-1 outline-amber-900/20">
            
            {/* Booklet Header */}
            <div className="shrink-0 pt-6 pb-4 px-6 border-b-2 border-double border-amber-900/20 text-center relative bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
              <button 
                onClick={() => setIsMenuModalOpen(false)} 
                className="absolute top-2 right-2 rounded-full p-2 text-amber-900/60 hover:bg-amber-900/10 hover:text-amber-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex justify-center mb-3">
                <img src={getImageUrl(restaurant.logoUrl || restaurant.bannerUrl)} alt={restaurant.name} className="h-16 w-16 rounded-full object-cover border-2 border-amber-900/20 shadow-md p-1 bg-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-950 uppercase tracking-widest font-serif">{restaurant.name}</h2>
              <p className="text-xs sm:text-sm text-amber-900/70 italic mt-1 font-serif">A Culinary Experience</p>
            </div>

            {/* Booklet Pages / Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] pb-24">
              {categoriesList.map(cat => {
                const catItems = filteredItems.filter(f => f.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat} className="mb-10">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="h-px bg-amber-900/20 flex-1"></div>
                      <h3 className="text-lg sm:text-xl font-bold text-amber-950 uppercase tracking-[0.2em] font-serif whitespace-nowrap px-2">
                        {cat}
                      </h3>
                      <div className="h-px bg-amber-900/20 flex-1"></div>
                    </div>

                    <div className="space-y-6">
                      {catItems.map(food => {
                        const isAvail = food.isAvailable && restaurant.isCurrentlyOpen !== false;
                        return (
                          <div 
                            key={food.id} 
                            onClick={() => { if(isAvail) openCustomization(food); }}
                            className={\`flex gap-3 sm:gap-4 items-start group transition-all \${!isAvail ? 'opacity-50 grayscale' : 'cursor-pointer hover:bg-amber-900/5 p-2 -mx-2 rounded-lg'}\`}
                          >
                            {food.imageUrl && (
                              <div className="shrink-0 relative">
                                <img src={food.imageUrl} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md shadow-sm border border-amber-900/20" />
                                <span className={\`absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full border border-white flex items-center justify-center \${food.isVeg ? 'bg-emerald-500' : 'bg-red-500'}\`}>
                                  <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
                                </span>
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-2">
                                <h4 className="font-serif font-bold text-amber-950 text-base sm:text-lg leading-tight group-hover:text-amber-700 transition-colors">
                                  {food.name}
                                </h4>
                                <div className="hidden sm:block flex-1 border-b-2 border-dotted border-amber-900/30 mx-2 mb-1.5"></div>
                                <span className="font-serif font-bold text-amber-900 text-base shrink-0">
                                  ₹{food.price}
                                </span>
                              </div>
                              
                              {food.description && (
                                <p className="text-amber-950/60 text-[11px] sm:text-xs italic mt-1.5 line-clamp-2 leading-relaxed">
                                  {food.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-2">
                                {!isAvail ? (
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded shadow-sm border border-red-200">Out of stock</span>
                                ) : (
                                  <>
                                    {(food.variants?.length > 0 || food.addonGroups?.length > 0) && (
                                      <span className="text-[9px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded shadow-sm border border-amber-200">Customizable</span>
                                    )}
                                    {food.isBestseller && (
                                      <span className="text-[9px] uppercase font-bold tracking-wider text-white bg-amber-600 px-2 py-0.5 rounded shadow-sm">Bestseller</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZATION BOTTOM SHEET */}
`;

content = content.replace(modalOldPattern, modalNew);
fs.writeFileSync(file, content);
console.log('Booklet patch applied.');
