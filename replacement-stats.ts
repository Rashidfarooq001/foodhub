  async getRestaurantStats(restaurantId: string, range: string = '7D') {
    const today = startOfDay(new Date());
    let fromDate = daysAgo(7);
    if (range === '30D') fromDate = daysAgo(30);
    else if (range === '90D') fromDate = daysAgo(90);

    const [
      activeSales,
      todaySales,
      completedOrdersCount,
      cancelledOrdersCount,
      pendingOrdersCount,
      topItems,
      reviews,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: fromDate }, paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: today }, paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.order.count({ where: { restaurantId, status: 'DELIVERED', createdAt: { gte: fromDate } } }),
      this.prisma.order.count({ where: { restaurantId, status: 'CANCELLED', createdAt: { gte: fromDate } } }),
      this.prisma.order.count({
        where: { restaurantId, status: { in: ['PENDING', 'PREPARING'] } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['foodItemId'],
        where: { order: { restaurantId, createdAt: { gte: fromDate } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.restaurantReview.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    // Build the weekly breakdown for the chart, adjusted to the range
    const days = range === '30D' ? 30 : range === '90D' ? 90 : 7;
    const weeklyBreakdown = [];
    for (let i = days - 1; i >= 0; i--) {
      const dStart = daysAgo(i);
      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);
      
      const dayData = await this.prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: dStart, lte: dEnd }, paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: { id: true },
      });
      weeklyBreakdown.push({
        day: dStart.toISOString().slice(0, 10),
        revenue: Number(dayData._sum.totalAmount || 0),
        orders: dayData._count.id,
      });
    }

    const avgRat = Math.round(Number(reviews._avg.rating ?? 4.5) * 100) / 100;
    const activeRevenue = Number(activeSales._sum.totalAmount || 0);

    return {
      activeRevenue,
      activeOrdersCount: activeSales._count.id,
      todayRevenue: Number(todaySales._sum.totalAmount || 0),
      todayOrders: todaySales._count.id,
      completedOrders: completedOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      pendingOrders: pendingOrdersCount,
      avgRating: avgRat,
      totalReviews: reviews._count.id,
      reviewCount: reviews._count.id,
      topItems: topItems.map((i) => ({ foodItemId: i.foodItemId, qty: i._sum.quantity })),
      weeklyRevenueData: weeklyBreakdown,
    };
  }
