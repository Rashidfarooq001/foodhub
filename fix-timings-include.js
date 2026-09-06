const fs = require('fs');

const path = 'apps/backend/src/modules/restaurants/restaurants.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Very specific, unique target: the update in updateVerificationStatus that does NOT include timings
const target = `      data: {
        status: prismaStatus,
        isOpen,
        rejectionReason:
          prismaStatus === RestaurantStatus.REJECTED || prismaStatus === RestaurantStatus.SUSPENDED
            ? rejectionReason?.trim() || null
            : null,
      },
    });`;

const replacement = `      data: {
        status: prismaStatus,
        isOpen,
        rejectionReason:
          prismaStatus === RestaurantStatus.REJECTED || prismaStatus === RestaurantStatus.SUSPENDED
            ? rejectionReason?.trim() || null
            : null,
      },
      include: { timings: true },
    });`;

if (!content.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}

// Count occurrences
const count = (content.match(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`Found ${count} occurrence(s)`);

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Done.');
