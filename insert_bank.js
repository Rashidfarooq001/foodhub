const fs = require('fs');
let content = fs.readFileSync('apps/backend/src/modules/restaurants/restaurants.service.ts', 'utf8');

const insertion = \
      // Save Bank Details if provided
      if (dto.accountNumber && dto.ifsc && dto.accountHolder) {
        await tx.restaurantBankAccount.create({
          data: {
            restaurantId: restaurant.id,
            accountHolder: dto.accountHolder.trim(),
            accountNumber: dto.accountNumber.trim(),
            ifscCode: dto.ifsc.trim(),
            bankName: dto.bankName?.trim() || 'Unknown Bank',
          },
        });
      }
\;

content = content.replace(
  /(\/\/ Link owner in RestaurantStaff table)/,
  insertion + '\n      '
);

fs.writeFileSync('apps/backend/src/modules/restaurants/restaurants.service.ts', content);
console.log('Inserted bank account creation logic.');
