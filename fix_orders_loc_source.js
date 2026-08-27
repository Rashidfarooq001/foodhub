const fs = require('fs');
let code = fs.readFileSync('apps/backend/src/modules/orders/orders.service.ts', 'utf8');

const quoteRegex = /const quote = await this\.quoteService\.calculateQuote\(\{\r?\n\s*foodSubtotal: subtotal,\r?\n\s*distanceKm: calculatedDistanceKm,\r?\n\s*restaurantId: dto\.restaurantId,\r?\n\s*discountAmount,\r?\n\s*packagingFee: 0,\r?\n\s*tipAmount: \(dto as any\)\.tipAmount \|\| 0,\r?\n\s*\}\);/g;

const replacement = `const quote = await this.quoteService.calculateQuote({
        foodSubtotal: subtotal,
        distanceKm: calculatedDistanceKm,
        restaurantId: dto.restaurantId,
        locationSource: locationSourceText as any,
        discountAmount,
        packagingFee: 0,
        tipAmount: (dto as any).tipAmount || 0,
      });`;

code = code.replace(quoteRegex, replacement);

fs.writeFileSync('apps/backend/src/modules/orders/orders.service.ts', code);
