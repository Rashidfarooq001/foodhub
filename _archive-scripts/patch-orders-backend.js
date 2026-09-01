const fs = require('fs');
const file = 'apps/backend/src/modules/orders/orders.service.ts';
let content = fs.readFileSync(file, 'utf8');

const regex =
  /let routeCoordinates: \[number, number\]\[\] = \[\];[\s\S]*?etaMins = routeData\.etaMinutes;\s+\} catch \(err: any\) \{[\s\S]*?\}\s+\}/;

const replacement = `if (order.status === 'DELIVERED') {
      driverLat = null;
      driverLng = null;
    }

    let routeCoordinates: [number, number][] = [];
    let roadDistanceKm: number | null = null;
    let etaMins = 15;

    let routeStartLat = restaurantLat;
    let routeStartLng = restaurantLng;
    let routeEndLat = customerLat;
    let routeEndLng = customerLng;

    const hasDriverLoc = driverLat && driverLng;
    const isPickedUp = order.status === 'PICKED_UP' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED';
    
    if (hasDriverLoc) {
      if (isPickedUp) {
        // Rider to Customer
        routeStartLat = driverLat;
        routeStartLng = driverLng;
      } else {
        // Rider to Restaurant
        routeStartLat = driverLat;
        routeStartLng = driverLng;
        routeEndLat = restaurantLat;
        routeEndLng = restaurantLng;
      }
    }

    if (routeStartLat && routeStartLng && routeEndLat && routeEndLng) {
      try {
        const routeData = await this.geolocationService.getRouteGeometry(
          routeStartLat,
          routeStartLng,
          routeEndLat,
          routeEndLng,
        );
        routeCoordinates = routeData.coordinates;
        roadDistanceKm = routeData.distanceKm;
        etaMins = routeData.etaMinutes;
      } catch (err: any) {
        this.logger.warn(\`[Order Tracking] Could not fetch Mappls road route geometry for order \${orderId}: \${err?.message || err}\`);
      }
    }`;

content = content.replace(
  /(const driverLat = order\.tracking\?\.currentLat \? Number\(order\.tracking\.currentLat\) : null;)/,
  'let driverLat = order.tracking?.currentLat ? Number(order.tracking.currentLat) : null;',
);
content = content.replace(
  /(const driverLng = order\.tracking\?\.currentLng \? Number\(order\.tracking\.currentLng\) : null;)/,
  'let driverLng = order.tracking?.currentLng ? Number(order.tracking.currentLng) : null;',
);

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched orders.service.ts backend tracking logic via Regex');
} else {
  console.log('Could not find regex target in orders.service.ts');
}
