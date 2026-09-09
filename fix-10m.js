const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.service.ts');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
/for \(const order of expiredPendingOrders\) \{[\s\S]*?this\.logger\.error\(\`Failed to auto-cancel expired order \$\{order\.id\} \(10-min rule\): \$\{err\.message\}\`\);\s*\}/g,
`for (const order of expiredPendingOrders) {
      try {
        await this.lifecycle.updateOrderStatus(
          order.id,
          'CANCELLED' as any,
          'SYSTEM',
          { cancellationReason: 'Restaurant acceptance timeout (10 minutes)' }
        );
        this.logger.log(\`Order \${order.id} was auto-cancelled due to 10-minute acceptance timeout.\`);
      } catch (err: any) {
        if (err.name !== 'ConflictException') {
          this.logger.error(\`Failed to auto-cancel expired order \${order.id} (10-min rule): \${err.message}\`);
        }
      }
    }`
);

fs.writeFileSync(file, code);
console.log('Fixed timeout logic');
