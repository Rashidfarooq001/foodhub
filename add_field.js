const fs = require('fs');
const path = require('path');
const schemaPath = path.join('apps', 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!schema.includes('cost_for_two')) {
  schema = schema.replace(
    /avgRating\s+Decimal\s+@default\(0\.0\)\s+@map\("avg_rating"\)\s+@db\.Decimal\(3, 2\)/,
    'avgRating       Decimal          @default(0.0) @map("avg_rating") @db.Decimal(3, 2)\n    costForTwo      Int?             @map("cost_for_two")'
  );
  fs.writeFileSync(schemaPath, schema);
  console.log("Added costForTwo to schema.prisma");
} else {
  console.log("costForTwo already exists in schema.prisma");
}
