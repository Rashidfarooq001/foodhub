const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/tax/order-quote.service.ts', 'utf8');

// The original logic:
// const deliveryFeeBaseAmount = 15.0;
// const deliveryFeeBaseKm = 3.0;
// const deliveryFeePerExtraKm = 5.0;

code = code.replace(
  /const deliveryFeeBaseAmount = 15\.0;/g,
  'const deliveryFeeBaseAmount = pricingConfig.minimumCustomerDeliveryFee;',
);
code = code.replace(
  /const deliveryFeePerExtraKm = 5\.0;/g,
  'const deliveryFeePerExtraKm = pricingConfig.customerDeliveryPerKm;',
);
code = code.replace(/const platformFee = 3\.0;/g, 'const platformFee = pricingConfig.platformFee;');

// What about taxes? The new config has foodGstRate.
// I will just use `Math.round(foodSubtotal * (pricingConfig.foodGstRate / 100) * 100) / 100` for totalCustomerTaxes.
code = code.replace(
  /const totalCustomerTaxes = 0\.0;/g,
  'const totalCustomerTaxes = Math.round(foodSubtotal * ((pricingConfig.foodGstRate || 0) / 100) * 100) / 100;',
);
code = code.replace(
  /taxes: totalCustomerTaxes, \/\/ Hardcoded to 0 for now/g,
  'taxes: totalCustomerTaxes,',
);

// Get config at the top of calculateQuote
code = code.replace(
  /async calculateQuote\(req: OrderQuoteRequest\): Promise<OrderQuoteResponse> \{/,
  'async calculateQuote(req: OrderQuoteRequest): Promise<OrderQuoteResponse> {\n    const pricingConfig = await this.pricingService.getActivePricingConfig();',
);

fs.writeFileSync('apps/backend/src/modules/tax/order-quote.service.ts', code);
console.log('Modified order-quote.service.ts');
