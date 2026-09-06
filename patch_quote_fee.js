const fs = require('fs');
const file = 'apps/backend/src/modules/tax/order-quote.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace Delivery Calculation
content = content.replace(
  /const deliveryRatePerKm = config\.customerDeliveryPerKm \?\? 15\.0;\s+let customerDeliveryFee: number \| null = null;\s+if \(routeAvailable && distanceKm !== null && distanceKm >= 0\) \{\s+customerDeliveryFee = Math\.round\(\(distanceKm \* deliveryRatePerKm\) \* 100\) \/ 100;\s+\} else \{\s+customerDeliveryFee = null; \/\/ Unresolved \/ null when route calculation is unavailable\s+\}/,
  `const deliveryFeeBaseKm = 3.0;
    const deliveryFeeBaseAmount = 15.0; // ₹15 fixed for first 3km
    const deliveryFeePerExtraKm = 5.0;  // ₹5 per km after 3km

    let customerDeliveryFee: number | null = null;
    if (routeAvailable && distanceKm !== null && distanceKm >= 0) {
      if (distanceKm <= deliveryFeeBaseKm) {
        customerDeliveryFee = deliveryFeeBaseAmount;
      } else {
        const extraKm = distanceKm - deliveryFeeBaseKm;
        customerDeliveryFee = Math.round((deliveryFeeBaseAmount + (extraKm * deliveryFeePerExtraKm)) * 100) / 100;
      }
    } else {
      customerDeliveryFee = null; // Unresolved / null when route calculation is unavailable
    }`
);

// Fix the return payload at the end
content = content.replace(
  /deliveryFeeBaseKm: 0,\s+deliveryFeeBaseAmount: 0,\s+deliveryFeePerExtraKm: deliveryRatePerKm,/,
  `deliveryFeeBaseKm: deliveryFeeBaseKm,
      deliveryFeeBaseAmount: deliveryFeeBaseAmount,
      deliveryFeePerExtraKm: deliveryFeePerExtraKm,`
);

fs.writeFileSync(file, content);
