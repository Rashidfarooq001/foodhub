const fs = require('fs');
const file = 'apps/customer-web/src/app/orders/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="rounded-2xl border-2 border-orange-500.*?<\/div>[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*\)}/s;

const newCard = \          <div className="rounded-xl border border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 p-4 shadow-sm mb-4">
            <div className="flex justify-between items-start border-b border-orange-200 pb-2 mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-black text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                  <span className="text-xs font-bold text-gray-700">#{activeOrder.orderNumber}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-orange-700">
                  <Clock className="h-3.5 w-3.5 text-orange-600" />
                  <span>Est. Arrival: ~{activeOrder.etaMins} mins</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-900">{activeOrder.restaurantName}</h3>
              <p className="text-xs font-semibold text-gray-600 truncate">
                {activeOrder.items?.map((i: any) => \\\\\\x \\\\\\).join(', ')}
              </p>
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                  {activeOrder.customerAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <Link
                href={\\\/orders/\\\\\\}
                className="flex-1 text-center rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 hover:bg-orange-50 transition"
              >
                View Details
              </Link>
              <Link
                href={\\\/orders/\\\/track\\\}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-black text-white hover:bg-orange-700 transition"
              >
                <span className="whitespace-nowrap">Track Map</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}\;

if (content.match(regex)) {
    content = content.replace(regex, newCard);
    fs.writeFileSync(file, content);
    console.log('Fixed');
} else {
    console.log('Regex failed');
}
