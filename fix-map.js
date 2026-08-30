const fs = require('fs');
const path = 'apps/customer-web/src/components/tracking/LiveTrackingMap.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('orderStatus?: string;')) {
    content = content.replace('driverName?: string;', 'driverName?: string;\n  orderStatus?: string;');
    content = content.replace('driverName,', 'driverName,\n  orderStatus,');
}

// "Before rider assignment: Do NOT show a rider marker."
// "After assignment: Show rider marker and rider-to-restaurant route as appropriate."
// "After PICKED_UP / OUT_FOR_DELIVERY: Focus on RIDER -> CUSTOMER route"
// We can use orderStatus to control whether we show the driver marker.
content = content.replace('const driverValid = hasValidCoords(driverLat, driverLng);', `
          const isPickedUp = orderStatus === 'PICKED_UP' || orderStatus === 'OUT_FOR_DELIVERY';
          const isDelivered = orderStatus === 'DELIVERED';
          const showDriver = !isDelivered && (orderStatus === 'DRIVER_ASSIGNED' || orderStatus === 'ARRIVED_AT_RESTAURANT' || isPickedUp);
          const driverValid = showDriver && hasValidCoords(driverLat, driverLng);`);

fs.writeFileSync(path, content, 'utf8');
