const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/tax/order-quote.service.ts', 'utf8');

const regex = /let customerDeliveryFee: number \| null = null;\r?\n\s*if \(routeAvailable && distanceKm !== null && distanceKm >= 0\) \{[\s\S]*?\} else \{[\s\S]*?customerDeliveryFee = null; \/\/ Unresolved \/ null when route calculation is unavailable\r?\n\s*\}/;

const replacement = `let customerDeliveryFee: number | null = null;
    if (locationSource === 'MANUAL_ADDRESS') {
      customerDeliveryFee = config.minimumCustomerDeliveryFee || 15.0; // Flat delivery charge for manual unverified addresses
      serviceable = true;
      deliveryEligible = true;
      routeAvailable = true; // Bypass route requirement
    } else if (routeAvailable && distanceKm !== null && distanceKm >= 0) {
      if (distanceKm <= deliveryFeeBaseKm) {
        customerDeliveryFee = deliveryFeeBaseAmount;
      } else {
        const extraKm = distanceKm - deliveryFeeBaseKm;
        customerDeliveryFee = Math.round((deliveryFeeBaseAmount + extraKm * deliveryFeePerExtraKm) * 100) / 100;
      }
    } else {
      customerDeliveryFee = null; // Unresolved / null when route calculation is unavailable
    }`;

code = code.replace(regex, replacement);

fs.writeFileSync('apps/backend/src/modules/tax/order-quote.service.ts', code);
