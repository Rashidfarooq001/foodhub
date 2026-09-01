const fs = require('fs');

let dtoPath = 'apps/backend/src/modules/auth/dto/register-restaurant-owner.dto.ts';
let dtoContent = fs.readFileSync(dtoPath, 'utf8');

if (!dtoContent.includes('accountHolder')) {
  let fields = \
  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Bank account holder name' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ example: '123456789012', description: 'Bank account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234', description: 'Bank IFSC Code' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank', description: 'Bank Name' })
  @IsOptional()
  @IsString()
  bankName?: string;
\;
  dtoContent = dtoContent.replace(/}\s*$/, fields + '\n}');
  fs.writeFileSync(dtoPath, dtoContent);
}

let svcPath = 'apps/backend/src/modules/auth/auth.service.ts';
let svcContent = fs.readFileSync(svcPath, 'utf8');

if (!svcContent.includes('tx.restaurantBankAccount.create')) {
  let insertion = \
      if (dto.accountNumber && dto.ifscCode && dto.accountHolder) {
        await tx.restaurantBankAccount.create({
          data: {
            restaurantId: restaurant.id,
            accountHolder: dto.accountHolder.trim(),
            accountNumber: dto.accountNumber.trim(),
            ifscCode: dto.ifscCode.trim(),
            bankName: dto.bankName?.trim() || 'Unknown Bank',
          },
        });
      }
\;
  
  svcContent = svcContent.replace(
    /await tx\.restaurantStaff\.create\(\{/,
    insertion + '\n      await tx.restaurantStaff.create({'
  );
  fs.writeFileSync(svcPath, svcContent);
}
console.log('Fixed auth backend');

