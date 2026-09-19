const fs = require('fs');
let content = fs.readFileSync('apps/backend/src/modules/orders/order-lifecycle.service.ts', 'utf8');
const search = `this.gateway.emitToAdmin(ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);`;
const replace = `this.gateway.emitToAdmin(ORDER_EVENTS.STATUS_UPDATED, sanitizedPayload);

      if (this.gateway.emitToAvailableDrivers && (targetStatus === 'PREPARING' || targetStatus === 'READY_FOR_PICKUP' || targetStatus === 'DRIVER_ASSIGNED' || targetStatus === 'CANCELLED')) {
        this.gateway.emitToAvailableDrivers('job.available' as any, sanitizedPayload);
      }`;
// We only want to replace the LAST occurrence, which is in transition()
const lastIndex = content.lastIndexOf(search);
if (lastIndex !== -1) {
  content = content.substring(0, lastIndex) + replace + content.substring(lastIndex + search.length);
  fs.writeFileSync('apps/backend/src/modules/orders/order-lifecycle.service.ts', content, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Not found');
}
