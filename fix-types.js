const fs = require('fs');
const file = 'packages/types/src/index.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("export * from './enums.js';", "export { UserRole, OrderStatus, DeliveryJobStatus, PaymentStatus, PaymentMethod, VehicleType, DeliveryMode, RestaurantDriverStatus } from './enums.js';");
fs.writeFileSync(file, content, 'utf8');
