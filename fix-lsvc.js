const fs = require('fs');
const path = require('path');

const lSvcPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'order-lifecycle.service.ts');
let lSvcCode = fs.readFileSync(lSvcPath, 'utf8');

lSvcCode = lSvcCode.replace(
/import \{ Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException \} from '@nestjs\/common';/,
`import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';`
);

lSvcCode = lSvcCode.replace(
/constructor\(\s*private readonly prisma: PrismaService,\s*private readonly gateway: OrdersGateway,\s*private readonly webPushService: WebPushService,/,
`constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
    private readonly webPushService: WebPushService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,`
);

lSvcCode = lSvcCode.replace(
/const updatedOrderRecord = await tx\.order\.update\(\{/g,
`// Trigger refund if cancelled and payment was completed
        if ((targetStatus === OrderStatus.CANCELLED || targetStatus === OrderStatus.REJECTED || targetStatus === OrderStatus.FAILED) && order.paymentStatus === 'COMPLETED') {
          // Fire refund asynchronously to avoid blocking the transaction
          setTimeout(() => {
            this.paymentsService.initiateRefund(order.id, extraData?.cancellationReason || 'Order Cancelled').catch(e => {
              console.error('Auto-refund failed for order ' + order.id, e);
            });
          }, 0);
        }

        const updatedOrderRecord = await tx.order.update({`
);

fs.writeFileSync(lSvcPath, lSvcCode);
console.log('Injected payments service into lifecycle');
