  @Get('stats')
  @ApiOperation({ summary: 'Get earnings & delivery statistics for driver' })
  async getDriverStats(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) {
      return {
        todayEarnings: 0,
        completedDeliveries: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        totalEarnings: 0,
        acceptanceRate: null,
        completionRate: null,
        avgRating: null,
        totalRatings: 0,
        walletBalance: 0,
        dutyStatus: 'ONLINE',
        dailyEarningsBreakdown: [],
        pendingSettlement: 0,
        availableForSettlement: 0,
        settledAmount: 0,
      };
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    // Canonical source of earnings is RiderSettlement
    const allSettlements = await this.prisma.riderSettlement.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });

    const sumPayout = (settlements: typeof allSettlements) =>
      settlements.reduce((sum, s) => sum + Number(s.netPayable || 0), 0);

    const todaySettlements = allSettlements.filter(s => s.createdAt >= todayStart);
    const weeklySettlements = allSettlements.filter(s => s.createdAt >= weekStart);
    const monthlySettlements = allSettlements.filter(s => s.createdAt >= monthStart);

    const dailyEarningsBreakdown: { date: string; day: string; pay: number }[] = [];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const daySettlements = allSettlements.filter(
        s => s.createdAt >= dayStart && s.createdAt <= dayEnd,
      );
      dailyEarningsBreakdown.push({
        date: dayStart.toISOString().slice(0, 10),
        day: DAY_NAMES[dayStart.getDay()],
        pay: Math.round(sumPayout(daySettlements)),
      });
    }

    const acceptedJobsCount = await this.prisma.deliveryJob.count({
      where: { driverId: driver.id },
    });
    const rejectedJobsCount = await this.prisma.deliveryJobRejection.count({
      where: { driverId: driver.id },
    });
    const totalOfferedJobs = acceptedJobsCount + rejectedJobsCount;
    const acceptanceRate = totalOfferedJobs > 0 ? Math.round((acceptedJobsCount / totalOfferedJobs) * 100) : null;
    const completionRate = acceptedJobsCount > 0 ? Math.round((allSettlements.length / acceptedJobsCount) * 100) : null;

    const ratings = await this.prisma.driverReview.findMany({
      where: { driverId: driver.id },
    });
    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : null;

    const userWallet = await this.prisma.wallet.findUnique({
      where: { userId: driver.userId }
    });
    const walletBalance = Number(userWallet?.balance || 0);

    const pendingSettlement = sumPayout(allSettlements.filter(s => s.status === 'ELIGIBLE' || s.status === 'PENDING'));
    const settledAmount = sumPayout(allSettlements.filter(s => s.status === 'COMPLETED'));

    return {
      todayEarnings: sumPayout(todaySettlements),
      completedDeliveries: allSettlements.length,
      weeklyEarnings: sumPayout(weeklySettlements),
      monthlyEarnings: sumPayout(monthlySettlements),
      totalEarnings: sumPayout(allSettlements),
      pendingSettlement,
      availableForSettlement: pendingSettlement,
      settledAmount,
      acceptanceRate,
      completionRate,
      avgRating,
      totalRatings,
      walletBalance,
      dutyStatus: driver.status === DriverStatus.OFFLINE ? 'OFFLINE' : 'ONLINE',
      dailyEarningsBreakdown,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get canonical settlement ledger history for driver' })
  async getDriverHistory(@Request() req: any) {
    const driver = await this.getDriverFromReq(req);
    if (!driver) return [];

    const settlements = await this.prisma.riderSettlement.findMany({
      where: { driverId: driver.id },
      include: {
        order: {
          select: { orderNumber: true, restaurant: { select: { name: true } }, deliveryAddress: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return settlements.map(s => ({
      id: s.id,
      orderId: s.orderId,
      orderNumber: s.order?.orderNumber,
      restaurantName: s.order?.restaurant?.name,
      customerAddress: (s.order?.deliveryAddress as any)?.addressLine1 || 'Customer Address',
      payout: Number(s.netPayable),
      deliveryFee: Number(s.netPayable),
      status: s.status,
      createdAt: s.createdAt,
    }));
  }
