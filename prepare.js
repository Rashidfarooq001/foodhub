const fs = require('fs');
const path = require('path');

const ctrlPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.controller.ts');
let ctrlCode = fs.readFileSync(ctrlPath, 'utf8');
ctrlCode = ctrlCode.replace(
  /async cancel\(@Param\('id'\) id: string, @Body\(\) cancelDto: CancelOrderDto, @Request\(\) req: any\) \{[\s\S]*?return this\.ordersService\.cancelOrder\(id, cancelDto, userId\);\s*\}/,
  `async cancel(@Param('id') id: string, @Body() cancelDto: CancelOrderDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.ordersService.cancelOrder(id, cancelDto, userId, role);
  }`
);
fs.writeFileSync(ctrlPath, ctrlCode);

const svcPath = path.join('apps', 'backend', 'src', 'modules', 'orders', 'orders.service.ts');
let svcCode = fs.readFileSync(svcPath, 'utf8');

// replace the method signature and policy check
svcCode = svcCode.replace(
/async cancelOrder\(orderId: string, dto: CancelOrderDto, cancelledByUserId: string\) \{[\s\S]*?const friendlyStatus: Record<string, string> = \{/g,
`async cancelOrder(orderId: string, dto: CancelOrderDto, cancelledByUserId: string, role?: string) {
    const order = await this.repo.findById(orderId);

    // If already cancelled just return success
    if (order.status === OrderStatus.CANCELLED) {
      return { message: 'Order is already cancelled.' };
    }

    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

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

    // Pass the cancellation logic down to lifecycle to handle refunds, jobs, and events
    await this.lifecycle.updateOrderStatus(order.id, OrderStatus.CANCELLED, cancelledByUserId, {
      cancellationReason: dto.reason || 'Cancelled by user',
    });

    return serializePrisma(await this.repo.findById(order.id));
  }

  /* DELETED PREVIOUS POLICY logic */
  const DUMMY_REMOVAL = {`
);

// We need to carefully remove the rest of the old logic inside cancelOrder. Let's do it precisely via AST or a safer regex.
