const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'orders', 'order-lifecycle.service.ts');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
/const updatedOrderRecord = await tx\.order\.update\(\{/g,
`// Trigger refund if cancelled and payment was completed
        if ((targetStatus === OrderStatus.CANCELLED || targetStatus === OrderStatus.REJECTED || targetStatus === OrderStatus.FAILED) && order.paymentStatus === 'COMPLETED') {
          // Fire refund asynchronously to avoid blocking the transaction
          setTimeout(() => {
            this.paymentsService.initiateRefund(order.id, extraData?.cancellationReason || 'Order Cancelled').catch(e => {
              this.logger.error('Auto-refund failed for order ' + order.id, e);
            });
          }, 0);
        }

        const updatedOrderRecord = await tx.order.update({`
);

fs.writeFileSync(file, code);
