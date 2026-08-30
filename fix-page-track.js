const fs = require('fs');
const path = 'apps/customer-web/src/app/orders/[id]/track/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix Map Height
content = content.replace(/h-\[350px\] md:h-\[400px\] lg:h-\[500px\]/g, 'h-[45vh] md:h-[50vh] lg:h-[600px] relative');

// Add Floating Track Rider button inside map container
const trackButtonHtml = `
            <DynamicLiveTrackingMap
              restaurantLat={restaurantLat}
              restaurantLng={restaurantLng}
              customerLat={customerLat}
              customerLng={customerLng}
              driverLat={currentDriverLat}
              driverLng={currentDriverLng}
              driverName={driverName}
              routeCoordinates={routeCoords}
            />
            {isDriverAssigned && driverLoc && order.status !== 'DELIVERED' && (
              <button
                onClick={handleRecenter}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-emerald-700 transition z-10 border-2 border-white"
              >
                <Bike className="h-4 w-4" /> Track Rider
              </button>
            )}
`;
content = content.replace(/<DynamicLiveTrackingMap[^>]+>[\s\S]*?<\/DynamicLiveTrackingMap>/, trackButtonHtml.trim());

// Fix ETA Display
const etaRegex = /<div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">[\s\S]*?<\/div>\s*<\/div>/;
const newEtaHtml = `{order.status === 'DELIVERED' ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 ring-1 ring-emerald-200">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-600">Status</p>
            <p className="text-sm font-black">Delivered o"</p>
          </div>
        </div>
      ) : isDriverAssigned ? (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-emerald-800 ring-1 ring-emerald-200">
          <Clock className="h-5 w-5 animate-spin text-emerald-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-600">Estimated Arrival</p>
            <p className="text-base font-black">{serverEtaMins ? \`\${serverEtaMins} Minutes\` : 'Calculating...'}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-3 text-orange-800 ring-1 ring-orange-200">
          <Clock className="h-5 w-5 animate-spin text-orange-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-orange-600">Status</p>
            <p className="text-xs font-black">Waiting for delivery partner</p>
          </div>
        </div>
      )}
      </div>`;
content = content.replace(etaRegex, newEtaHtml);

// Remove etaMins calculation since we use serverEtaMins directly above
content = content.replace('const etaMins = serverEtaMins ?? 15;', '');

// For distance, the backend sends distance in trackData. We already have distanceKm state, let's use it in Driver Card.
const driverCardRegex = /<span\s*className=\{\`rounded-full px-2.5 py-0.5 text-\[10px\] font-bold uppercase \$\{\s*isDriverAssigned \? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'\s*\}\`\}\s*>[\s\S]*?<\/span>/;
const newDriverCardLabel = `<span
                  className={\`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase \${
                    order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' : isDriverAssigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }\`}
                >
                  {order.status === 'DELIVERED' ? 'Delivery Completed' : isDriverAssigned ? (distanceKm ? \`\${distanceKm.toFixed(1)} km away\` : 'Active Courier') : 'Searching for Courier'}
                </span>`;
content = content.replace(driverCardRegex, newDriverCardLabel);

// Fix Driver Card distance tracking
content = content.replace('if (trackData?.driverLat && trackData?.driverLng) {', `if (trackData?.distanceKm) setDistanceKm(trackData.distanceKm);\n          if (trackData?.etaMins) setServerEtaMins(trackData.etaMins);\n          if (trackData?.driverLat && trackData?.driverLng) {`);

fs.writeFileSync(path, content, 'utf8');
