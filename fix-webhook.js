const fs = require('fs');
const path = require('path');

const filePath = path.join('apps', 'backend', 'src', 'modules', 'payments', 'payments.service.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
/      \/\/ Idempotency: If already marked COMPLETED on both payment and order, avoid redundant updates\s*if \([\s\S]*?\}\s*await this\.prisma\.\$transaction\(\[[\s\S]*?\]\);/g,
`      // Atomic Idempotency: Protect against concurrent duplicate webhooks
      const updated = await this.prisma.$transaction(async (tx) => {
        const lockedPayment = await tx.$queryRawUnsafe(\`SELECT status FROM payments WHERE id = $1::uuid FOR UPDATE\`, existingPayment.id);
        if (!lockedPayment || lockedPayment.length === 0) return false;
        
        if (lockedPayment[0].status === 'COMPLETED') {
          return false; // Already completed
        }

        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'COMPLETED',
            razorpayPaymentId: paymentEntity.id || existingPayment.razorpayPaymentId,
          },
        });
        
        await tx.order.update({
          where: { id: existingPayment.orderId },
          data: {
            paymentStatus: 'COMPLETED',
          },
        });
        
        return true;
      });

      if (!updated) return; // Idempotency check hit or record missing`
);

fs.writeFileSync(filePath, code);
console.log('Fixed webhook race condition');
