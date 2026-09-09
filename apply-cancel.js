const fs = require('fs');
const path = require('path');
const file = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.service.ts');
let code = fs.readFileSync(file, 'utf8');

const startIdx = code.indexOf('async cancelOrder(orderId: string, dto: CancelOrderDto, cancelledByUserId: string) {');
const endStr = "return { message: 'Order cancelled successfully.' };\n  }";
const endIdx = code.indexOf(endStr) + endStr.length;

const oldBlock = code.substring(startIdx, endIdx);

const newBlock = `async cancelOrder(orderId: string, dto: CancelOrderDto, cancelledByUserId: string, role?: string) {
    const order = await this.repo.findById(orderId);

    // Idempotency check
    if (order.status === OrderStatus.CANCELLED) {
      return { message: 'Order is already cancelled.' };
    }

    const isAdmin = role === 'SUPER_ADMIN';

    if (!isAdmin) {
      // CUSTOMER CANCELLATION LOGIC
      const customer = await this.prisma.customer.findFirst({
        where: { OR: [{ userId: cancelledByUserId }, { id: cancelledByUserId }] },
      });
      const customerId = customer?.id;
      
      if (!customerId || order.customerId !== customerId) {
        throw new ForbiddenException('You are not authorised to cancel this order.');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Customers can only cancel orders while they are in PENDING status.');
      }

      const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
      if (elapsedMs > 60000) {
        throw new BadRequestException('Orders can only be cancelled within 60 seconds of placement.');
      }
    }

    // Let the lifecycle service handle the transaction, refunds, and side-effects securely
    await this.lifecycle.updateOrderStatus(order.id, OrderStatus.CANCELLED, cancelledByUserId, {
      cancellationReason: dto.reason || 'Cancelled by user',
    });

    // Fire notifications
    this.webPushService.sendPushNotification(order.restaurantId, {
      title: \`Order #\${order.orderNumber} Cancelled\`,
      body: \`Order was cancelled. Reason: \${dto.reason}\`,
      url: '/orders',
    });

    return { message: 'Order cancelled successfully.' };
  }`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync(file, code);

const ctrlFile = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.controller.ts');
let cCode = fs.readFileSync(ctrlFile, 'utf8');
cCode = cCode.replace(
  /async cancel\(@Param\('id'\) id: string, @Body\(\) cancelDto: CancelOrderDto, @Request\(\) req: any\) \{\s*const userId = req\.user\?\.id;\s*return this\.ordersService\.cancelOrder\(id, cancelDto, userId\);\s*\}/,
  `async cancel(@Param('id') id: string, @Body() cancelDto: CancelOrderDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.ordersService.cancelOrder(id, cancelDto, userId, role);
  }`
);
fs.writeFileSync(ctrlFile, cCode);
