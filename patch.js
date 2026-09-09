const fs = require('fs');
let content = fs.readFileSync('apps/customer-web/src/components/tracking/LiveTrackingMap.tsx', 'utf8');

const custSearch = /if \\(custValid\\) \\{[\\s\\S]*?\\}\\);[\\s\\S]*?\\}/m;
const custReplace = \if (custValid) {
              new window.mappls.Marker({
                map,
                position: { lat: customerLat, lng: customerLng },
                html: \\\<div class="zomato-marker customer-marker"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>\\\,
                offset: [0, -20],
              });
            }\;

content = content.replace(custSearch, custReplace);

const riderHtml = \html: \\\<div class="zomato-rider-pulse-container"><div class="zomato-rider-pulse"></div><div class="zomato-rider-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg></div></div>\\\,\;

content = content.replace(/html: \\\<div style="width:40px.*?<\\/div>\\\,/g, riderHtml);

content = content.replace('_updatePolyline(map, routeCoordinates);', '_updatePolyline(map, routeCoordinates, polylineRef);');
content = content.replace("strokeColor: '#f97316',", "strokeColor: '#3b82f6',");

fs.writeFileSync('apps/customer-web/src/components/tracking/LiveTrackingMap.tsx', content);
