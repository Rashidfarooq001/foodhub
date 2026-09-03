  async exportRestaurantCsv(restaurantId: string, type: string, from: Date, to: Date): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: from, lte: to } },
      include: {
        customer: { include: { user: { include: { profile: true } } } },
        restaurantSettlement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = orders.map((o) => ({
      OrderNo: o.orderNumber,
      Date: o.createdAt.toISOString().slice(0, 10),
      Status: o.status,
      Customer: o.customer?.user?.profile?.firstName || 'Guest',
      GrossSales: Number(o.totalAmount),
      Commission: o.restaurantSettlement ? Number(o.restaurantSettlement.commissionAmount) : 0,
      NetPayout: o.restaurantSettlement ? Number(o.restaurantSettlement.netPayable) : 0,
    }));

    return formatCsv(rows);
  }
