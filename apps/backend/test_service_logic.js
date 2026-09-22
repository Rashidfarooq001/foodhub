const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const userId = 'b671b6e7-b483-4692-98ba-b76e5c70a888';
  let whereClause = {
    customer: { userId },
    deletedAt: null,
  };
  
  try {
    const orders = await p.order.findMany({
      where: whereClause,
      include: {
        restaurant: true,
        orderItems: { include: { foodItem: true } },
        orderTimelines: { orderBy: { createdAt: 'asc' } },
        tracking: true,
        cancellation: true,
        refund: true,
        deliveryJob: {
          include: {
            driver: {
              include: {
                user: { include: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
    
    const mapped = orders.map((ord) => ({
        id: ord.id,
        orderNumber: ord.orderNumber,
        restaurantName: ord.restaurant?.name || 'Restaurant',
        restaurantBanner: ord.restaurant?.bannerUrl,
        date:
          ord.createdAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) +
          ' ' +
          ord.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
        createdAt: ord.createdAt,
        deliveredAt: ord.deliveryJob?.deliveredAt || ord.updatedAt,
        totalAmount: Number(ord.totalAmount),
        itemCount: ord.orderItems.reduce((acc, i) => acc + i.quantity, 0),
        itemsSummary: ord.orderItems
          .map((i) => `${i.quantity}x ${i.foodItem?.name || 'Item'}`)
          .join(', '),
        items: ord.orderItems.map((i) => ({
          id: i.id,
          name: i.foodItem?.name || 'Item',
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        paymentMethod: ord.paymentMethod,
        cancellationReason: ord.cancellation?.reason,
        isRefunded: !!ord.refund,
      }));
      console.log("Success! Returned", mapped.length);
  } catch (e) {
    console.error("FAILED!", e);
  }
}
main().finally(() => p.$disconnect());
